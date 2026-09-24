import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-user';
import { getPreferences, updatePreferences } from '@/lib/db';
import { asLocale, asReaderGender } from '@/lib/i18n';

export const runtime = 'nodejs';

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;
  try {
    return NextResponse.json(await getPreferences(userId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unable to load preferences' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  try {
    const result = await updatePreferences(userId, {
      language: asLocale(body.language),
      gender: asReaderGender(body.gender),
      completed: Boolean(body.completed),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unable to save preferences' }, { status: 500 });
  }
}
