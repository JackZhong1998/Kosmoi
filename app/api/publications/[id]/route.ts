import { NextResponse } from 'next/server';
import { getPublication, getPublicationHome } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

const cacheHeaders = { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 });
  }
  const { id } = await params;
  try {
    if (new URL(req.url).searchParams.get('view') === 'home') {
      const publication = await getPublicationHome(id);
      if (!publication) return NextResponse.json({ error: '未找到这部小说' }, { status: 404 });
      return NextResponse.json({
        id: publication.id,
        title: publication.title,
        language: publication.language || 'en',
        gender: publication.recommendation_gender || 'all',
        tags: publication.recommendation_tags || [],
        summary: publication.recommendation_summary || publication.logline || '',
        excerpt: publication.excerpt || '',
        wordCount: publication.word_count || 0,
      }, { headers: cacheHeaders });
    }
    const publication = await getPublication(id);
    if (!publication) return NextResponse.json({ error: '未找到这部小说' }, { status: 404 });
    return NextResponse.json({
      id: publication.id,
      title: publication.title,
      proseDoc: publication.prose_doc,
      chaptersDoc: publication.chapters_doc || '',
      language: publication.language || 'en',
      gender: publication.recommendation_gender || 'all',
      tags: publication.recommendation_tags || [],
      summary: publication.recommendation_summary || publication.logline || '',
      excerpt: publication.excerpt || '',
      wordCount: publication.word_count || 0,
    }, { headers: cacheHeaders });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '无法打开这部小说' }, { status: 500 });
  }
}
