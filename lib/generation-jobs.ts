import 'server-only';

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { Readable } from 'node:stream';
import { nextAutoStep, MAX_AUTO_ROUNDS } from './auto-write';
import { getStory, updateStory } from './db';
import { replyPreview } from './generation-preview';
import { asLocale, localeInstruction, type Locale } from './i18n';
import { lockedStyleName, parseCandidates } from './parse-docs';
import { storyFromProse } from './parse-story';
import { pickDesignTitle, pickTitle, storyTitle } from './story-title';
import { getServiceSupabase } from './supabase';
import { latestStructureRaw, parseStructure, revisionForStructure, sceneNamesFromStructure, shouldRefreshStructure, stripStructureMessages, withStructureContext } from './structure';
import type { StoryProject } from './stories';
import type { ChatMessage, DocKind, StudioDocs } from './types';

export type GenerationJob = {
  id: string;
  user_id: string;
  story_id: string;
  kind: 'single' | 'auto' | 'structure';
  status: 'queued' | 'running' | 'done' | 'error' | 'canceled';
  input: {
    userText?: string;
    fallback?: DocKind;
    messagesForModel?: ChatMessage[];
    locale?: Locale;
    dispatchToken?: string;
    stage?: 'generate' | 'structure';
    designBefore?: string;
    structureUserText?: string;
    stall?: number;
  };
  output: string;
  thinking: string;
  error: string;
  round: number;
  cancel_requested: boolean;
  updated_at: string;
};

const TABLE = 'generation_jobs';

export async function latestJob(userId: string, storyId: string): Promise<GenerationJob | null> {
  const { data, error } = await getServiceSupabase().from(TABLE)
    .select('*').eq('user_id', userId).eq('story_id', storyId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data as GenerationJob | null;
}

export async function recoverStaleJob(job: GenerationJob): Promise<GenerationJob> {
  if (job.status !== 'running' || Date.now() - Date.parse(job.updated_at) < 330_000) return job;
  const cutoff = new Date(Date.now() - 330_000).toISOString();
  const { data, error } = await getServiceSupabase().from(TABLE)
    .update({ status: 'queued', output: '', thinking: '', error: '' })
    .eq('id', job.id).eq('status', 'running').lt('updated_at', cutoff)
    .select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return (data as GenerationJob | null) || job;
}

export async function getJob(id: string): Promise<GenerationJob | null> {
  const { data, error } = await getServiceSupabase().from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as GenerationJob | null;
}

async function patchJob(id: string, patch: Partial<GenerationJob>) {
  const { error } = await getServiceSupabase().from(TABLE).update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function createJob(userId: string, storyId: string, kind: GenerationJob['kind'], input: GenerationJob['input']) {
  const existing = await latestJob(userId, storyId);
  if (existing && (existing.status === 'queued' || existing.status === 'running')) throw new Error('这篇故事正在生成');
  const { data, error } = await getServiceSupabase().from(TABLE).insert({
    user_id: userId, story_id: storyId, kind,
    input: { ...input, dispatchToken: randomUUID() },
  }).select('*').single();
  if (error || !data) throw new Error(error?.message || '无法启动生成任务');
  return data as GenerationJob;
}

function docsFrom(story: StoryProject): StudioDocs {
  return { topic: story.topicDoc, design: story.designDoc, chapters: story.chaptersDoc, style: story.styleDoc, prose: story.proseDoc };
}

function modelInput(job: GenerationJob, story: StoryProject) {
  if (job.kind === 'single') {
    const userText = job.input.userText || '';
    const history: ChatMessage[] = [
      ...story.messages.filter((message) => message.role !== 'assistant' || message.content.trim()),
      { role: 'user', content: userText },
    ];
    const messages = job.input.messagesForModel
      ? stripStructureMessages(job.input.messagesForModel)
      : withStructureContext(history, story.chaptersDoc);
    return { history, messages, fallback: job.input.fallback, userText };
  }
  const parsed = parseStructure(story.chaptersDoc);
  const storyData = storyFromProse(story.proseDoc, parsed);
  const structureText = latestStructureRaw(story.messages) || story.chaptersDoc;
  const step = nextAutoStep({
    topicDoc: story.topicDoc,
    designDoc: story.designDoc,
    styleDoc: story.styleDoc,
    proseDoc: story.proseDoc,
    story: storyData,
    title: storyTitle({ topicTitle: story.topicTitle, topicDoc: story.topicDoc, designDoc: story.designDoc, metaTitle: story.title }),
    styleName: story.styleName || lockedStyleName(story.styleDoc) || parseCandidates(story.styleDoc)[0]?.name || '烟火白话',
    structureText,
    mapNames: sceneNamesFromStructure(structureText),
  });
  if (step.kind === 'needTopic' || step.kind === 'done') return { terminal: step.kind } as const;
  const history: ChatMessage[] = [...story.messages, { role: 'user', content: step.prompt }];
  return {
    history,
    messages: step.slimHistory ? stripStructureMessages(step.slimHistory) : withStructureContext(history, story.chaptersDoc),
    fallback: step.fallback,
    userText: step.prompt,
    stepKind: step.kind,
  };
}

function openRouter(apiKey: string, payload: string): Promise<ReadableStream<Uint8Array>> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST', family: 4,
      headers: {
        Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Spark Story Studio',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      if ((res.statusCode || 500) >= 400) {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => reject(new Error(`OpenRouter 请求失败：${res.statusCode} ${Buffer.concat(chunks).toString().slice(0, 500)}`)));
      } else resolve(Readable.toWeb(res) as ReadableStream<Uint8Array>);
    });
    req.on('error', reject);
    req.end(payload);
  });
}

function contentText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (!Array.isArray(raw)) return '';
  return raw.map((part) => {
    if (typeof part === 'string') return part;
    if (!part || typeof part !== 'object') return '';
    const value = part as { text?: unknown; content?: unknown };
    return typeof value.text === 'string' ? value.text : typeof value.content === 'string' ? value.content : '';
  }).join('');
}

async function generate(job: GenerationJob, messages: ChatMessage[], onUpdate: (output: string, thinking: string) => Promise<boolean>, effort: 'high' | 'medium' = 'high') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('缺少 OPENROUTER_API_KEY');
  const prompt = await readFile(path.join(process.cwd(), 'lib/system-prompt.md'), 'utf8');
  const payload = JSON.stringify({
    model: process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash',
    temperature: 0.85, stream: true, max_tokens: 32768,
    reasoning: { enabled: true, effort, exclude: false },
    messages: [{ role: 'system', content: `${prompt.trim()}${localeInstruction(asLocale(job.input.locale))}` }, ...messages],
  });
  const body = await openRouter(apiKey, payload);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  let thinking = '';
  let lastFlush = 0;
  let canceled = false;
  async function flush(force = false) {
    if (!force && Date.now() - lastFlush < 1000) return;
    lastFlush = Date.now();
    canceled = await onUpdate(output, thinking);
    if (canceled) await reader.cancel().catch(() => null);
  }
  try {
    while (!canceled) {
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
        let event: { error?: { message?: string } | string; choices?: Array<{ delta?: { content?: unknown; reasoning?: string; reasoning_content?: string; reasoning_details?: Array<{ text?: string; content?: string }> }; message?: { content?: unknown } }> };
        try { event = JSON.parse(data); } catch { continue; }
        if (event.error) throw new Error(typeof event.error === 'string' ? event.error : event.error.message || '生成失败');
        const choice = event.choices?.[0];
        output += contentText(choice?.delta?.content) || (!output ? contentText(choice?.message?.content) : '');
        thinking += choice?.delta?.reasoning || choice?.delta?.reasoning_content ||
          choice?.delta?.reasoning_details?.map((detail) => detail.text || detail.content || '').join('') || '';
      }
      await flush();
    }
    await flush(true);
  } finally {
    reader.releaseLock();
  }
  if (!output.trim() && !canceled) {
    const docAt = thinking.search(/===DOC:(?:topic|design|chapters|style|prose)\+?===/);
    if (docAt >= 0) output = thinking.slice(docAt).trim();
  }
  if (!output.trim() && !canceled) throw new Error('模型没有写出正文。');
  return { output, canceled };
}

async function runStructure(job: GenerationJob, origin: string) {
  const story = await getStory(job.user_id, job.story_id);
  if (!story) throw new Error('找不到这篇草稿');
  const response = await fetch(`${origin}/api/structure`, {
    method: 'POST', cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-generation-job-id': job.id,
      'x-job-token': job.input.dispatchToken || '',
    },
    body: JSON.stringify({
      storyId: job.story_id, messages: story.messages, designDoc: story.designDoc,
      revision: revisionForStructure(job.input.structureUserText || '', job.input.designBefore || ''),
      locale: job.input.locale,
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`结构整理失败：${response.status} ${body.slice(0, 500)}`);
  let completed = false;
  for (const line of body.split('\n')) {
    if (!line.startsWith('data:')) continue;
    try {
      const event = JSON.parse(line.slice(5));
      if (event.error) throw new Error(event.error.message || '结构整理失败');
      if (event.choices?.[0]?.delta?.content) completed = true;
    } catch (err) {
      if (err instanceof SyntaxError) continue;
      throw err;
    }
  }
  if (!completed) throw new Error('结构整理没有返回结果');
  const canceled = Boolean((await getJob(job.id))?.cancel_requested);
  if (canceled) {
    await patchJob(job.id, { status: 'canceled', output: '', thinking: '' });
    return false;
  }
  if (job.kind === 'auto' && job.round < MAX_AUTO_ROUNDS) {
    await patchJob(job.id, { status: 'queued', input: { ...job.input, stage: 'generate' }, output: '', thinking: '' });
    return true;
  }
  await patchJob(job.id, { status: 'done', output: '', thinking: '' });
  return false;
}

async function runRound(job: GenerationJob, origin: string) {
  if (job.cancel_requested) {
    await patchJob(job.id, { status: 'canceled', output: '', thinking: '' });
    return false;
  }
  if (job.input.stage === 'structure') return runStructure(job, origin);
  const story = await getStory(job.user_id, job.story_id);
  if (!story) throw new Error('找不到这篇草稿');
  const input = modelInput(job, story);
  if ('terminal' in input) {
    await patchJob(job.id, { status: 'done', output: '', thinking: '', error: '' });
    return false;
  }
  const { history, messages, fallback, userText } = input;
  const base = { docs: docsFrom(story) };
  const onUpdate = async (text: string, thinking: string) => {
    await patchJob(job.id, { output: text, thinking });
    return Boolean((await getJob(job.id))?.cancel_requested);
  };
  let result;
  try {
    result = await generate(job, messages, onUpdate);
  } catch (err) {
    if (!(err instanceof Error) || !/模型没有写出正文/.test(err.message)) throw err;
    result = await generate(job, messages, onUpdate, 'medium');
  }
  const { output, canceled } = result;
  let designAfter = story.designDoc;
  let stall = job.input.stall || 0;
  if (output.trim()) {
    const preview = replyPreview(base, output, fallback, parseStructure(base.docs.chapters));
    const docs = preview.nextDocs;
    const title = pickDesignTitle(docs.design) || pickTitle(docs.topic) ||
      storyTitle({ topicTitle: story.topicTitle, topicDoc: docs.topic, designDoc: docs.design, metaTitle: preview.nextStory.meta?.title || story.title });
    const next = await updateStory(job.user_id, job.story_id, {
      title, topicTitle: title,
      topicDoc: docs.topic, designDoc: docs.design, chaptersDoc: docs.chapters,
      styleDoc: docs.style, styleName: lockedStyleName(docs.style) || story.styleName,
      proseDoc: docs.prose,
      messages: [...history, { role: 'assistant', content: output }],
    });
    if (!next) throw new Error('无法保存生成结果');
    designAfter = next.designDoc;
    if ('stepKind' in input && (input.stepKind === 'proseStart' || input.stepKind === 'proseContinue')) {
      const beforeCount = Object.keys(storyFromProse(story.proseDoc, parseStructure(story.chaptersDoc)).nodes).length;
      const afterCount = Object.keys(storyFromProse(next.proseDoc, parseStructure(next.chaptersDoc)).nodes).length;
      stall = afterCount <= beforeCount ? stall + 1 : 0;
    }
  }
  if (canceled) {
    await patchJob(job.id, { status: 'canceled', thinking: '' });
    return false;
  }
  if (stall >= 2) {
    await patchJob(job.id, { status: 'error', error: '连续两轮没写出新场面', thinking: '' });
    return false;
  }
  if (shouldRefreshStructure({ userText, designBefore: story.designDoc, designAfter, assistant: output })) {
    await patchJob(job.id, {
      status: 'queued', round: job.round + 1, output: '', thinking: '',
      input: { ...job.input, stage: 'structure', designBefore: story.designDoc, structureUserText: userText, stall },
    });
    return true;
  }
  if (job.kind === 'auto' && job.round + 1 < MAX_AUTO_ROUNDS) {
    await patchJob(job.id, { status: 'queued', round: job.round + 1, output: '', thinking: '', input: { ...job.input, stall } });
    return true;
  }
  await patchJob(job.id, {
    status: 'done', round: job.round + 1, output: '', thinking: '',
    error: job.kind === 'auto' ? '写完全篇已达轮次上限，可再点一次接着写' : '',
  });
  return false;
}

export async function runJob(id: string, origin: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from(TABLE).update({ status: 'running' })
    .eq('id', id).eq('status', 'queued').select('*').maybeSingle();
  if (error || !data) return;
  const job = data as GenerationJob;
  try {
    const again = await runRound(job, origin);
    if (again) {
      try {
        const response = await fetch(`${origin}/api/generation-jobs/continue`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-job-token': job.input.dispatchToken || '' },
          body: JSON.stringify({ id }), cache: 'no-store',
        });
        if (!response.ok && (await getJob(id))?.status === 'queued') throw new Error('下一轮生成没有启动');
      } catch (err) {
        if ((await getJob(id))?.status === 'queued') throw err;
      }
    }
  } catch (err) {
    const current = await getJob(id);
    if (current?.status === 'running' && current.round === job.round && current.input.stage === job.input.stage || current?.status === 'queued') {
      await patchJob(id, { status: 'error', error: err instanceof Error ? err.message : '生成失败', thinking: '' });
    }
  }
}
