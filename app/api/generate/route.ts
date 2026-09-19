import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash';
  if (!apiKey) {
    return Response.json({ error: '缺少 OPENROUTER_API_KEY' }, { status: 500 });
  }

  const body = await req.json();
  const systemPrompt = String(body.systemPrompt || '');
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.85;

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Spark Story Studio',
    },
    body: JSON.stringify({
      model,
      temperature,
      stream: true,
      max_tokens: 24576,
      reasoning: { max_tokens: 512 },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    return Response.json(
      { error: `OpenRouter 请求失败：${upstream.status} ${errText.slice(0, 800)}` },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
