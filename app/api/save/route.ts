import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || '').replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, '');
  const content = String(body.content || '');
  if (!name) return Response.json({ error: 'missing name' }, { status: 400 });
  const dir = path.join(process.cwd(), 'output');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), content, 'utf8');
  return Response.json({ ok: true });
}
