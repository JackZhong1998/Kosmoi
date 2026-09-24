import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { getProfile } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  try {
    const profile = await getProfile(userId);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法读取资料' }, { status: 500 });
  }
}
