import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { createStoryRow, listStorySummaries, openCreateWorkspace } from '@/lib/db';
import { isStoryId } from '@/lib/stories';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  try {
    const open = new URL(req.url).searchParams.get('open');
    if (open !== null) {
      const preferred = isStoryId(open) ? open : '';
      const data = await openCreateWorkspace(userId, preferred);
      return NextResponse.json(data);
    }
    const stories = await listStorySummaries(userId);
    return NextResponse.json({ stories });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法读取草稿' }, { status: 500 });
  }
}

export async function POST() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  try {
    const story = await createStoryRow(userId);
    return NextResponse.json({ story });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法创建故事' }, { status: 500 });
  }
}
