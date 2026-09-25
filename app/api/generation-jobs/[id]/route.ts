import { requireUserId } from '@/lib/auth-user';
import { getJob } from '@/lib/generation-jobs';
import { getServiceSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error) return error;
  if (!userId) return Response.json({ error: '请先登录' }, { status: 401 });
  const { id } = await params;
  const job = await getJob(id);
  if (!job || job.user_id !== userId) return Response.json({ error: '未找到任务' }, { status: 404 });
  if (job.status === 'queued') {
    await getServiceSupabase().from('generation_jobs').update({ status: 'canceled', cancel_requested: true }).eq('id', id).eq('status', 'queued');
  } else if (job.status === 'running') {
    await getServiceSupabase().from('generation_jobs').update({ cancel_requested: true }).eq('id', id);
  }
  return Response.json({ ok: true });
}
