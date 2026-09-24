import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { publishFromStory } from '@/lib/db';
import { isStoryId } from '@/lib/stories';
import { asLocale } from '@/lib/i18n';
import { recommendNovel } from '@/lib/recommendation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const storyId = String(body.storyId || '');
  const proseDoc = String(body.proseDoc || '').trim();
  const title = String(body.title || '').trim();
  if (!isStoryId(storyId)) return NextResponse.json({ error: '缺少故事' }, { status: 400 });
  if (!proseDoc) return NextResponse.json({ error: '还没有可以发布的正文' }, { status: 400 });
  if (!title) return NextResponse.json({ error: '还没有书名' }, { status: 400 });
  try {
    const language = asLocale(body.language);
    const recommendation = await recommendNovel({
      designDoc: typeof body.designDoc === 'string' ? body.designDoc : '',
      locale: language,
      audience: body.audience === 'female' || body.audience === 'male' ? body.audience : 'all',
      existingTags: Array.isArray(body.tagPath) ? body.tagPath.map(String) : [],
    });
    const meta = await publishFromStory(userId, {
      storyId,
      title,
      proseDoc,
      topicDoc: typeof body.topicDoc === 'string' ? body.topicDoc : '',
      designDoc: typeof body.designDoc === 'string' ? body.designDoc : '',
      chaptersDoc: typeof body.chaptersDoc === 'string' ? body.chaptersDoc : '',
      styleDoc: typeof body.styleDoc === 'string' ? body.styleDoc : '',
      language,
      recommendation,
    });
    return NextResponse.json({ ok: true, ...meta });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '发布失败' }, { status: 500 });
  }
}
