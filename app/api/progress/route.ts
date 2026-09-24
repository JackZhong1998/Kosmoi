import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { getReadingProgress, listReadingProgress, upsertReadingProgress } from '@/lib/db';
import type { PlaySnapshot, ReadingRecord } from '@/lib/reading-history';

export const runtime = 'nodejs';

function asSnapshot(item: unknown): item is PlaySnapshot {
  if (!item || typeof item !== 'object') return false;
  const row = item as PlaySnapshot;
  return (
    typeof row.nodeId === 'string' &&
    !!row.stats &&
    typeof row.stats === 'object' &&
    Array.isArray(row.facts) &&
    Array.isArray(row.via)
  );
}

export async function GET(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const publicationId = new URL(req.url).searchParams.get('publicationId') || '';
  try {
    if (publicationId) {
      const progress = await getReadingProgress(userId, publicationId);
      return NextResponse.json({ progress });
    }
    const records = await listReadingProgress(userId);
    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法读取进度' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: '缺少作品' }, { status: 400 });
  const entry: ReadingRecord = {
    id,
    title: String(body.title || '未命名互动小说'),
    chapter: String(body.chapter || ''),
    readAt: typeof body.readAt === 'number' ? body.readAt : Date.now(),
    nodeId: typeof body.nodeId === 'string' ? body.nodeId : undefined,
    stats: body.stats && typeof body.stats === 'object' ? body.stats : {},
    facts: Array.isArray(body.facts) ? body.facts.filter((item: unknown) => typeof item === 'string') : [],
    path: Array.isArray(body.path) ? body.path.filter(asSnapshot) : [],
    explored: Array.isArray(body.explored) ? body.explored.filter((item: unknown) => typeof item === 'string') : [],
    memory: body.memory && typeof body.memory === 'object' ? body.memory : {},
  };
  try {
    const progress = await upsertReadingProgress(userId, entry);
    return NextResponse.json({ progress });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法保存进度' }, { status: 500 });
  }
}
