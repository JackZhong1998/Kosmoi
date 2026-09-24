import https from 'node:https';
import { NextRequest } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { parseTopicCards, topicSystemPrompt, localTopics } from '@/lib/topic-prompt';
import type { Audience } from '@/lib/topic-tags';
import { asLocale, localeInstruction } from '@/lib/i18n';

export const runtime = 'nodejs';
export const maxDuration = 30;

function openRouterJson(apiKey: string, payload: string): Promise<{ status: number; body: string }> {
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
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          resolve({ status: res.statusCode || 502, body: Buffer.concat(chunks).toString('utf8') });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('选题生成超时'));
    });
    req.write(payload);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireUserId();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const path = Array.isArray(body.path) ? body.path.map((item: unknown) => String(item)).filter(Boolean) : [];
  const audience = (['female', 'male', 'neutral'].includes(body.audience) ? body.audience : 'female') as Audience;
  const round = typeof body.round === 'number' && body.round > 0 ? Math.floor(body.round) : 1;
  const locale = asLocale(body.locale);
  if (!path.length) {
    return Response.json({ error: '请先选择标签' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = 'deepseek/deepseek-v4.1-flash';
  const exclude = Array.isArray(body.exclude)
    ? body.exclude.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 12)
    : [];
  if (!apiKey) {
    return Response.json({ topics: localTopics(path, round, locale), fallback: true });
  }

  const tagged = [audience === 'female' ? '女性向' : audience === 'male' ? '男性向' : '无性向', ...path];
  const avoid = exclude.length ? `\n不要与这些已出现过的选题重复：\n- ${exclude.join('\n- ')}` : '';
  const payload = JSON.stringify({
    model,
    temperature: 0.95,
    stream: false,
    max_tokens: 700,
    reasoning: {
      enabled: true,
      effort: 'high',
      max_tokens: 256,
      exclude: true,
    },
    messages: [
      { role: 'system', content: `${topicSystemPrompt(tagged, round)}${localeInstruction(locale)}` },
      { role: 'user', content: `已选标签路径：${tagged.join(' -> ')}${avoid}\n换一批序号：${round}\n请严格输出 JSON 数组，每条只含 emotion 与 title。三个选题的情感基调必须不同，标题 50 到 80 字。` },
    ],
  });

  try {
    const upstream = await openRouterJson(apiKey, payload);
    if (upstream.status >= 400) {
      return Response.json({ topics: localTopics(path, round, locale), fallback: true });
    }
    const json = JSON.parse(upstream.body) as { choices?: { message?: { content?: string } }[] };
    const text = String(json.choices?.[0]?.message?.content || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    const topics = parseTopicCards(text) || localTopics(path, round, locale);
    return Response.json({ topics, fallback: !parseTopicCards(text) });
  } catch {
    return Response.json({ topics: localTopics(path, round, locale), fallback: true });
  }
}
