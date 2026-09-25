import { after } from 'next/server';
import { getJob, runJob } from '@/lib/generation-jobs';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const token = req.headers.get('x-job-token') || '';
  if (!id || !token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const job = await getJob(id);
  if (!job || job.input.dispatchToken !== token || job.status !== 'queued') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  after(() => runJob(id, new URL(req.url).origin));
  return Response.json({ accepted: true }, { status: 202 });
}
