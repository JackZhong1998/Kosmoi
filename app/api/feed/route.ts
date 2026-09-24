import { NextResponse } from 'next/server';
import { listPublishedFeed } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';
import { asLocale, asReaderGender } from '@/lib/i18n';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stories: [] });
  }
  try {
    const { searchParams } = new URL(req.url);
    const stories = await listPublishedFeed({
      language: asLocale(searchParams.get('language')),
      gender: asReaderGender(searchParams.get('gender')),
    });
    return NextResponse.json({ stories });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '列表加载失败' }, { status: 500 });
  }
}
