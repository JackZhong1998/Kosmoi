import type { ChatMessage } from './types';
import { currentLocale } from '@/components/LocaleProvider';

export type ReasoningEffort = 'low' | 'medium' | 'high';

function textFromContent(raw: unknown): string {
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

function reasoningFromDelta(delta: Record<string, unknown>): string {
  if (typeof delta.reasoning === 'string' && delta.reasoning) return delta.reasoning;
  if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) return delta.reasoning_content;
  if (delta.reasoning && typeof delta.reasoning === 'object') {
    const nested = delta.reasoning as { content?: unknown; text?: unknown };
    if (typeof nested.content === 'string') return nested.content;
    if (typeof nested.text === 'string') return nested.text;
  }
  const details = delta.reasoning_details;
  if (Array.isArray(details)) {
    return details
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        const row = item as { text?: unknown; content?: unknown; type?: unknown };
        if (row.type === 'reasoning.encrypted') return '';
        if (typeof row.text === 'string') return row.text;
        if (typeof row.content === 'string') return row.content;
        return '';
      })
      .join('');
  }
  return '';
}

/** 解析一条 SSE data。正文在 delta.content；有的供应商把整段正文只放在最后的 message.content。 */
export function readSseData(
  data: string,
  state: { full: string; finish: string },
): { think: string; text: string } | 'ignore' {
  if (!data || data === '[DONE]') return 'ignore';
  const json = JSON.parse(data) as {
    error?: { message?: unknown } | string;
    choices?: Array<{ finish_reason?: unknown; delta?: Record<string, unknown>; message?: Record<string, unknown> }>;
  };
  if (json.error) {
    const message = typeof json.error === 'string' ? json.error : json.error.message;
    throw new Error(typeof message === 'string' && message.trim() ? message : '生成失败');
  }
  const choice = json.choices?.[0];
  if (!choice) return 'ignore';
  if (typeof choice.finish_reason === 'string' && choice.finish_reason) state.finish = choice.finish_reason;
  const delta = choice.delta || {};
  const think = reasoningFromDelta(delta);
  let text = textFromContent(delta.content);
  if (!text && !state.full) text = textFromContent(choice.message?.content);
  return { think, text };
}

export function emptyReplyError(finish: string) {
  return finish === 'length'
    ? '模型把篇幅都用在思考上了，没有写出正文。'
    : '模型没有写出正文。';
}

export async function streamGenerate(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  onThink?: (full: string) => void,
  signal?: AbortSignal,
  reasoningEffort?: ReasoningEffort,
): Promise<string> {
  return streamChat(
    '/api/generate',
    { systemPrompt, messages, locale: currentLocale(), temperature: 0.85, ...(reasoningEffort ? { reasoningEffort } : {}) },
    onDelta,
    onThink,
    signal,
  );
}

export async function streamStructure(
  messages: ChatMessage[],
  designDoc: string,
  revision: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
  storyId = '',
): Promise<string> {
  try {
    return await streamChat(
      '/api/structure',
      { messages, designDoc, revision, locale: currentLocale(), ...(storyId ? { storyId } : {}) },
      onDelta,
      undefined,
      signal,
    );
  } catch (err) {
    if (err instanceof Error && /没有写出正文/.test(err.message)) {
      throw new Error('结构没整理出来，可以再试一次。');
    }
    throw err;
  }
}

async function streamChat(
  url: string,
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
  onThink?: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || '生成失败');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let thinking = '';
  let finish = '';
  const onAbort = () => {
    reader.cancel().catch(() => null);
  };
  if (signal?.aborted) {
    onAbort();
    throw new DOMException('Aborted', 'AbortError');
  }
  signal?.addEventListener('abort', onAbort, { once: true });

  function takeLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    const state = { full, finish };
    let parsed: { think: string; text: string } | 'ignore';
    try {
      parsed = readSseData(data, state);
    } catch (err) {
      if (err instanceof SyntaxError) return;
      throw err;
    }
    finish = state.finish;
    if (parsed === 'ignore') return;
    if (parsed.think) {
      thinking += parsed.think;
      onThink?.(thinking);
    }
    if (parsed.text) {
      full += parsed.text;
      onDelta(full);
    }
  }

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) takeLine(line);
    }
    buffer += decoder.decode();
    if (buffer.trim()) takeLine(buffer);
    if (!full.trim()) {
      const docAt = thinking.search(/===DOC:(?:topic|design|chapters|style|prose)\+?===/);
      if (docAt >= 0) {
        full = thinking.slice(docAt).trim();
        onDelta(full);
      }
    }
    if (!full.trim()) throw new Error(emptyReplyError(finish));
    return full;
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}
