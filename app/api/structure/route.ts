import { readFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextRequest } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { updateStory } from '@/lib/db';
import { isStoryId } from '@/lib/stories';
import {
  extractJsonField,
  flowIdsFromUnknown,
  mergeStructureParts,
  parseStructure,
  serializeStructure,
  stripStructureMessages,
  structurePartTask,
  type StructurePart,
} from '@/lib/structure';
import { asLocale, localeInstruction } from '@/lib/i18n';

export const runtime = 'nodejs';
export const maxDuration = 800;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

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

function toChatMessages(raw: unknown[]): ChatTurn[] {
  const out: ChatTurn[] = [];
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

function asPart(value: unknown): StructurePart | '' {
  return value === 'flowchart' || value === 'nodes' || value === 'states' ? value : '';
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function asText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (!Array.isArray(raw)) return '';
  return raw
    .map((part) => {
      if (typeof part === 'string') return part;
      if (!part || typeof part !== 'object') return '';
      const row = part as { text?: unknown; content?: unknown };
      if (typeof row.text === 'string') return row.text;
      if (typeof row.content === 'string') return row.content;
      return '';
    })
    .join('');
}

function reasoningText(source: Record<string, unknown> | undefined): string {
  if (!source) return '';
  if (typeof source.reasoning === 'string') return source.reasoning;
  if (typeof source.reasoning_content === 'string') return source.reasoning_content;
  if (source.reasoning && typeof source.reasoning === 'object') {
    const nested = source.reasoning as { content?: unknown; text?: unknown };
    if (typeof nested.content === 'string') return nested.content;
    if (typeof nested.text === 'string') return nested.text;
  }
  return '';
}

function upstreamError(json: { error?: { message?: unknown } | string }): string {
  if (!json.error) return '';
  const message = typeof json.error === 'string' ? json.error : json.error.message;
  return typeof message === 'string' ? message.trim() : '';
}

/** 有的回复把 JSON 写在思考里，正文槽是空的。结构不需要小说正文，思考里的 JSON 也算。 */
function recoverStructureText(raw: string): string {
  const cleaned = raw
    .replace(/<\/?think(?:ing)?>/gi, '')
    .replace(/<\/?reasoning>/gi, '')
    .trim();
  if (!cleaned.includes('{')) return '';
  return cleaned;
}

async function readSseContent(body: ReadableStream): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let reasoning = '';
  let failure = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const errText = upstreamError(json);
        if (errText) failure = errText;
        const choice = json.choices?.[0];
        const delta = (choice?.delta || {}) as Record<string, unknown>;
        const message = choice?.message as Record<string, unknown> | undefined;
        const deltaText = asText(delta.content);
        text += deltaText || asText(message?.content);
        reasoning += reasoningText(delta) + reasoningText(message);
      } catch {
        /* ignore a broken sse line */
      }
    }
  }
  const visible = stripLeakedThinking(text);
  if (visible.trim()) return visible;
  const recovered = recoverStructureText(text) || recoverStructureText(reasoning);
  if (recovered) return recovered;
  if (failure) throw new Error(failure);
  return '';
}

const sseHeaders = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
};

function sseData(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

async function completePart(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatTurn[],
): Promise<string> {
  const base = {
    model,
    temperature: 0.2,
    stream: true,
    max_tokens: 32768,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  };
  let payload = JSON.stringify({ ...base, response_format: { type: 'json_object' } });
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let upstream = await openRouterStream(apiKey, payload);
      if (upstream.status === 400) {
        const errText = await new Response(upstream.body).text().catch(() => '');
        if (/response_format|json_object/i.test(errText)) {
          payload = JSON.stringify(base);
          upstream = await openRouterStream(apiKey, payload);
        } else if (/reasoning/i.test(errText)) {
          payload = JSON.stringify({ ...base, response_format: { type: 'json_object' } });
          upstream = await openRouterStream(apiKey, payload);
        } else {
          throw new Error(`结构编辑请求失败：400 ${errText.slice(0, 400)}`);
        }
      }
      if (upstream.status >= 400) {
        const errText = await new Response(upstream.body).text().catch(() => '');
        throw new Error(`结构编辑请求失败：${upstream.status} ${errText.slice(0, 400)}`);
      }
      const text = await readSseContent(upstream.body);
      if (text.trim()) return text;
      lastErr = '结构没整理出来，可以再试一次。';
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      const connectFail = /fetch failed|Connect Timeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT/i.test(lastErr);
      if (!connectFail || attempt === 3) throw new Error(lastErr);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  throw new Error(lastErr || '结构编辑失败');
}

function missingNodeIds(flowIds: string[], nodes: unknown): string[] {
  const have = new Set(flowIdsFromUnknown(nodes));
  return flowIds.filter((id) => !have.has(id));
}

function diagnoseFlow(raw: string, flowIds: string[]) {
  const head = raw.trim().slice(0, 120).replace(/\s+/g, ' ');
  return `拿到 ${raw.length} 字、${flowIds.length} 个节点。开头：${head || '（空）'}`;
}

function slimHistory(history: ChatTurn[]): ChatTurn[] {
  if (history.length <= 4) return history;
  return history.slice(-4).map((msg) => ({
    ...msg,
    content: msg.content.length > 2500 ? `${msg.content.slice(0, 2500)}\n\n……（已截）` : msg.content,
  }));
}

async function buildFullStructure(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: ChatTurn[],
  designDoc: string,
  revision: string,
): Promise<string> {
  const slim = slimHistory(history);
  let flowText = '';
  let flowchart: unknown;
  let flowIds: string[] = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const messages: ChatTurn[] =
      attempt === 1
        ? [...slim, structurePartTask({ part: 'flowchart', designDoc, revision })]
        : [
            structurePartTask({ part: 'flowchart', designDoc, revision }),
            {
              role: 'assistant',
              content: flowText.slice(0, 1500) || '{}',
            },
            {
              role: 'user',
              content:
                '上一份流程图解析失败或节点太少。请重新只输出 {"flowchart":[...]}，至少 8 个节点，用 next 连线。不要写 nodes/states，不要解释。',
            },
          ];
    flowText = await completePart(apiKey, model, systemPrompt, messages);
    flowchart = extractJsonField(flowText, 'flowchart');
    flowIds = flowIdsFromUnknown(flowchart);
    if (flowIds.length >= 4) break;
  }
  if (flowIds.length < 4) {
    throw new Error(`节点和流程图没有按 JSON 返回（流程图节点太少：${diagnoseFlow(flowText, flowIds)}）`);
  }

  let nodes = extractJsonField(flowText, 'nodes');
  let pending = missingNodeIds(flowIds, nodes);
  for (let i = 0; i < 6 && pending.length; i++) {
    const chunk = pending.slice(0, 12);
    const nodeText = await completePart(apiKey, model, systemPrompt, [
      structurePartTask({ part: 'nodes', designDoc, flowIds, missingIds: chunk }),
    ]);
    const extra = extractJsonField(nodeText, 'nodes');
    const prev = Array.isArray(nodes) ? nodes : [];
    const more = Array.isArray(extra) ? extra : [];
    nodes = [...prev, ...more];
    pending = missingNodeIds(flowIds, nodes);
  }
  if (!Array.isArray(nodes) || flowIdsFromUnknown(nodes).length < 4) {
    throw new Error(
      `节点和流程图没有按 JSON 返回（节点表没写完：已有 ${flowIdsFromUnknown(nodes).length}/${flowIds.length}）`,
    );
  }

  let states: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const stateText = await completePart(apiKey, model, systemPrompt, [
      structurePartTask({ part: 'states', designDoc, flowIds }),
    ]);
    states = extractJsonField(stateText, 'states');
    if (states && typeof states === 'object') break;
  }
  if (!states || typeof states !== 'object') {
    throw new Error('节点和流程图没有按 JSON 返回（状态表没写完）');
  }

  const merged = mergeStructureParts({ flowchart, nodes, states });
  const parsed = parseStructure(merged);
  if (!parsed) throw new Error('节点和流程图没有按 JSON 返回（JSON 格式坏了）');
  return serializeStructure(parsed);
}

export async function GET() {
  return Response.json({ error: '结构接口只接受 POST' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash';
  if (!apiKey) {
    return Response.json({ error: '缺少 OPENROUTER_API_KEY' }, { status: 500 });
  }

  const body = await req.json();
  const systemPrompt = `${(await readFile(path.join(process.cwd(), 'lib/structure-prompt.md'), 'utf8')).trim()}${localeInstruction(asLocale(body.locale))}`;
  const history = stripStructureMessages(toChatMessages(Array.isArray(body.messages) ? body.messages : []));
  const designDoc = typeof body.designDoc === 'string' ? body.designDoc : '';
  const revision = typeof body.revision === 'string' ? body.revision : '';
  const storyId = typeof body.storyId === 'string' ? body.storyId : '';
  const part = asPart(body.part);
  const flowIds = asStringList(body.flowIds);
  const missingIds = asStringList(body.missingIds);
  if (!designDoc.trim()) {
    return Response.json({ error: '还没有故事设计' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const ping = setInterval(() => {
        try {
          send(`: ping\n\n`);
        } catch {
          /* 连接已断开，生成仍继续，最后写回数据库 */
        }
      }, 12000);
      try {
        send(`: start\n\n`);
        const text = part
          ? await completePart(apiKey, model, systemPrompt, [
              ...(part === 'flowchart' ? history : []),
              structurePartTask({ part, designDoc, revision, flowIds, missingIds }),
            ])
          : await buildFullStructure(apiKey, model, systemPrompt, history, designDoc, revision);
        if (!part && userId && isStoryId(storyId)) {
          const saved = await updateStory(userId, storyId, { chaptersDoc: text });
          if (!saved) console.error('[structure] 未找到故事，结构没有写回', storyId);
        }
        try {
          send(sseData({ choices: [{ delta: { content: text } }] }));
          send(`data: [DONE]\n\n`);
        } catch {
          /* 浏览器已经断开；完整结构已写回故事 */
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[structure]', message);
        try {
          send(sseData({ error: { message } }));
        } catch {
          /* 浏览器已经断开，错误留在服务端日志 */
        }
      } finally {
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
