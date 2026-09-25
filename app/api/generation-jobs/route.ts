import { after } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { createJob, latestJob, recoverStaleJob, runJob } from '@/lib/generation-jobs';
import { getStory } from '@/lib/db';
import { asLocale } from '@/lib/i18n';
import { isStoryId } from '@/lib/stories';
import type { DocKind } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const KINDS = new Set<DocKind>(['topic', 'design', 'chapters', 'style', 'prose']);

export async function GET(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  if (!userId) return Response.json({ error: '请先登录' }, { status: 401 });
  const storyId = new URL(req.url).searchParams.get('storyId') || '';
  if (!isStoryId(storyId)) return Response.json({ error: '无效的故事' }, { status: 400 });
  try {
    const latest = await latestJob(userId, storyId);
    const job = latest ? await recoverStaleJob(latest) : null;
    if (job?.status === 'queued') after(() => runJob(job.id, new URL(req.url).origin));
    return Response.json({ job: job ? { ...job, stage: job.input.stage, input: undefined } : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : '无法读取任务' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  if (!userId) return Response.json({ error: '请先登录' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const storyId = typeof body.storyId === 'string' ? body.storyId : '';
  if (!isStoryId(storyId)) return Response.json({ error: '无效的故事' }, { status: 400 });
  const kind = body.kind === 'auto' || body.kind === 'structure' ? body.kind : 'single';
  const userText = typeof body.userText === 'string' ? body.userText.trim() : '';
  if (kind === 'single' && !userText) return Response.json({ error: '没有写作指令' }, { status: 400 });
  const fallback = KINDS.has(body.fallback) ? body.fallback as DocKind : undefined;
  try {
    const story = await getStory(userId, storyId);
    if (!story) return Response.json({ error: '未找到这篇草稿' }, { status: 404 });
    if (kind === 'structure' && !story.designDoc.trim()) return Response.json({ error: '还没有故事设计' }, { status: 400 });
    const current = await latestJob(userId, storyId);
    if (current?.status === 'queued' || current?.status === 'running') {
      return Response.json({ error: '这篇故事正在生成' }, { status: 409 });
    }
    const job = await createJob(userId, storyId, kind, {
      userText, fallback, locale: asLocale(body.locale),
      messagesForModel: Array.isArray(body.messagesForModel) ? body.messagesForModel : undefined,
      ...(kind === 'structure' ? {
        stage: 'structure' as const,
        designBefore: story.designDoc,
        structureUserText: '按当前故事设计重新整理结构',
      } : {}),
    });
    if (job.status === 'queued') after(() => runJob(job.id, new URL(req.url).origin));
    return Response.json({ job: { ...job, stage: job.input.stage, input: undefined } }, { status: 202 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : '无法启动任务' }, { status: 500 });
  }
}
