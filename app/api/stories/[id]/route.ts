import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { getStory, updateStory, type StoryPatch } from '@/lib/db';
import { latestJob } from '@/lib/generation-jobs';
import { isStoryId } from '@/lib/stories';
import type { Audience } from '@/lib/topic-tags';
import type { ChatMessage } from '@/lib/types';

export const runtime = 'nodejs';

function asAudience(value: unknown): Audience | '' | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (value === 'female' || value === 'male' || value === 'neutral') return value;
  return undefined;
}

function asMessages(value: unknown): ChatMessage[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ChatMessage => {
    if (!item || typeof item !== 'object') return false;
    const rec = item as ChatMessage;
    return (rec.role === 'user' || rec.role === 'assistant') && typeof rec.content === 'string';
  });
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function patchFrom(body: Record<string, unknown>): StoryPatch {
  return {
    title: asString(body.title),
    topicTitle: asString(body.topicTitle),
    audience: asAudience(body.audience),
    tagPath: asStringArray(body.tagPath),
    topicDoc: asString(body.topicDoc),
    designDoc: asString(body.designDoc),
    chaptersDoc: asString(body.chaptersDoc),
    styleDoc: asString(body.styleDoc),
    styleName: asString(body.styleName),
    proseDoc: asString(body.proseDoc),
    messages: asMessages(body.messages),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { id } = await params;
  if (!isStoryId(id)) return NextResponse.json({ error: '无效的故事' }, { status: 400 });
  try {
    const story = await getStory(userId, id);
    if (!story) return NextResponse.json({ error: '未找到这篇草稿' }, { status: 404 });
    return NextResponse.json({ story });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法读取草稿' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const { id } = await params;
  if (!isStoryId(id)) return NextResponse.json({ error: '无效的故事' }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const active = await latestJob(userId, id);
    if (active?.status === 'queued' || active?.status === 'running') {
      return NextResponse.json({ error: '这篇故事正在生成，请稍后再保存' }, { status: 409 });
    }
    const story = await updateStory(userId, id, patchFrom(body));
    if (!story) return NextResponse.json({ error: '未找到这篇草稿' }, { status: 404 });
    return NextResponse.json({ story });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法保存故事' }, { status: 500 });
  }
}
