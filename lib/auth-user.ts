import { auth, currentUser } from '@clerk/nextjs/server';
import { getServiceSupabase, isSupabaseConfigured } from './supabase';

function clerkReady() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function requireUserId() {
  if (!clerkReady()) {
    return { userId: null as string | null, error: Response.json({ error: '请先登录' }, { status: 401 }) };
  }
  const { userId } = await auth();
  if (!userId) {
    return { userId: null as string | null, error: Response.json({ error: '请先登录' }, { status: 401 }) };
  }
  if (!isSupabaseConfigured()) {
    return {
      userId: null as string | null,
      error: Response.json({ error: '数据库未配置' }, { status: 503 }),
    };
  }
  try {
    await ensureProfile(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法写入用户资料';
    return { userId: null as string | null, error: Response.json({ error: message }, { status: 500 }) };
  }
  return { userId, error: null };
}

export async function ensureProfile(userId: string) {
  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return;

  const user = await currentUser();
  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    '用户';
  const avatarUrl = user?.imageUrl || '';
  const email = user?.primaryEmailAddress?.emailAddress || '';

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    email,
  });
  if (profileError) throw new Error(profileError.message);

  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan: 'free',
    status: 'active',
  });
  if (subError && subError.code !== '23505') throw new Error(subError.message);
}
