import { readFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextRequest } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { asLocale, localeInstruction } from '@/lib/i18n';

export const runtime = 'nodejs';
export const maxDuration = 800;

function openRouterStream(apiKey: string, payload: string): Promise<{ status: number; body: ReadableStream }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        family: 4,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Spark Story Studio',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        resolve({
          status: res.statusCode || 502,
          body: Readable.toWeb(res) as ReadableStream,
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function stripLeakedThinking(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
}

function toChatMessages(raw: unknown[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const role = rec.role === 'assistant' ? 'assistant' : rec.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = typeof rec.content === 'string' ? stripLeakedThinking(rec.content) : '';
    if (!content) continue;
    out.push({ role, content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const { error } = await requireUserId();
  if (error) return error;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash';
  if (!apiKey) {
    return Response.json({ error: '缺少 OPENROUTER_API_KEY' }, { status: 500 });
  }

  const body = await req.json();
  const filePrompt = await readFile(path.join(process.cwd(), 'lib/system-prompt.md'), 'utf8').catch(() => '');
  const systemPrompt = `${filePrompt.trim() || String(body.systemPrompt || '')}${localeInstruction(asLocale(body.locale))}`;
  const messages = toChatMessages(Array.isArray(body.messages) ? body.messages : []);
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.85;
  const effort =
    body.reasoningEffort === 'low' || body.reasoningEffort === 'medium' || body.reasoningEffort === 'high'
      ? body.reasoningEffort
      : 'high';

  const payload = JSON.stringify({
    model,
    temperature,
    stream: true,
    max_tokens: 32768,
    reasoning: {
      enabled: true,
      effort,
      exclude: false,
    },
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  let upstream: { status: number; body: ReadableStream } | null = null;
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      upstream = await openRouterStream(apiKey, payload);
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      const connectFail = /fetch failed|Connect Timeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT/i.test(lastErr);
      if (!connectFail || attempt === 3) {
        return Response.json({ error: `OpenRouter 连接失败：${lastErr}` }, { status: 502 });
      }
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }

  if (!upstream || upstream.status >= 400) {
    const errText = upstream ? await new Response(upstream.body).text().catch(() => '') : lastErr;
    return Response.json(
      { error: `OpenRouter 请求失败：${upstream?.status || ''} ${String(errText).slice(0, 800)}` },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
