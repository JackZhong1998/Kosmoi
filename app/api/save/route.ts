import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { updateStory } from '@/lib/db';
import { isStoryId } from '@/lib/stories';
import type { DocKind } from '@/lib/types';

export const runtime = 'nodejs';

const DOC_FIELD: Record<string, 'topicDoc' | 'designDoc' | 'chaptersDoc' | 'styleDoc' | 'proseDoc'> = {
  '选题文档.md': 'topicDoc',
  '故事设计文档.md': 'designDoc',
  '章节卡.md': 'chaptersDoc',
  '文风.md': 'styleDoc',
  '小说正文.md': 'proseDoc',
};

export async function POST(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const storyId = String(body.storyId || '');
  const content = String(body.content || '');
  const field = DOC_FIELD[String(body.name || '') as DocKind | string];
  if (!isStoryId(storyId)) return NextResponse.json({ error: '缺少故事' }, { status: 400 });
  if (!field) return NextResponse.json({ error: 'missing name' }, { status: 400 });
  try {
    const story = await updateStory(userId, storyId, { [field]: content });
    if (!story) return NextResponse.json({ error: '未找到这篇草稿' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '保存失败' }, { status: 500 });
  }
}
