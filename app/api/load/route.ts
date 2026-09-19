import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const dir = path.join(process.cwd(), 'output');
  const read = async (name: string) => {
    try {
      return await fs.readFile(path.join(dir, name), 'utf8');
    } catch {
      return '';
    }
  };
  const [topicDoc, designDoc, proseDoc, evalNote, messagesRaw] = await Promise.all([
    read('选题文档.md'),
    read('故事设计文档.md'),
    read('小说正文.md'),
    read('评测.md'),
    read('messages.json'),
  ]);
  let messages = [];
  try {
    messages = messagesRaw ? JSON.parse(messagesRaw) : [];
  } catch {
    messages = [];
  }
  return Response.json({ topicDoc, designDoc, proseDoc, evalNote, messages });
}
