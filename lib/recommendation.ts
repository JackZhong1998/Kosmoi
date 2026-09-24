import 'server-only';
import https from 'node:https';
import type { Locale, ReaderGender } from './i18n';

export type Recommendation = {
  gender: ReaderGender;
  tags: string[];
  summary: string;
};

function openRouterJson(apiKey: string, payload: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        family: 4,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Spark Novel Recommender',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => resolve({ status: res.statusCode || 502, body: Buffer.concat(chunks).toString('utf8') }));
      },
    );
    req.on('error', reject);
    req.setTimeout(45000, () => req.destroy(new Error('Recommendation agent timed out')));
    req.write(payload);
    req.end();
  });
}

function cleanTags(values: unknown, locale: Locale): string[] {
  const tags = Array.isArray(values)
    ? values.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const fallback = locale === 'zh'
    ? ['互动叙事', '命运选择', '情感沉浸', '多结局', '角色成长']
    : ['Interactive fiction', 'Choices matter', 'Emotional', 'Multiple endings', 'Character growth'];
  return [...new Set([...tags, ...fallback])].slice(0, 6);
}

function fallbackRecommendation(
  designDoc: string,
  locale: Locale,
  audience: ReaderGender,
  existingTags: string[],
): Recommendation {
  const compact = designDoc
    .replace(/[#*_>`\[\]]/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' ')
    .slice(0, locale === 'zh' ? 180 : 320);
  return {
    gender: audience,
    tags: cleanTags(existingTags, locale),
    summary: compact || (locale === 'zh'
      ? '一部由你的选择改变角色命运的沉浸式互动小说。'
      : 'An immersive interactive novel where your choices reshape the characters and their fate.'),
  };
}

export async function recommendNovel(input: {
  designDoc: string;
  locale: Locale;
  audience: ReaderGender;
  existingTags?: string[];
}): Promise<Recommendation> {
  const fallback = fallbackRecommendation(input.designDoc, input.locale, input.audience, input.existingTags || []);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !input.designDoc.trim()) return fallback;

  const language = input.locale === 'zh' ? '简体中文' : 'English';
  const payload = JSON.stringify({
    model: process.env.OPENROUTER_RECOMMENDATION_MODEL || 'qwen/qwen3.8-omni-flash',
    temperature: 0.25,
    stream: false,
    max_tokens: 900,
    response_format: { type: 'json_object' },
    reasoning: { enabled: false, exclude: true },
    messages: [
      {
        role: 'system',
        content: `You are Spark's novel recommendation editor. Read a story design document and return strict JSON only. Classify the best discovery audience as female, male, or all. Produce 5-6 concise theme tags and a vivid spoiler-light synopsis. All tags and the synopsis must be written in ${language}. Schema: {"gender":"female|male|all","tags":["..."],"summary":"..."}.`,
      },
      { role: 'user', content: input.designDoc.slice(0, 24000) },
    ],
  });

  try {
    const response = await openRouterJson(apiKey, payload);
    if (response.status >= 400) return fallback;
    const envelope = JSON.parse(response.body) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = String(envelope.choices?.[0]?.message?.content || '').replace(/```(?:json)?|```/gi, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]) as { gender?: unknown; tags?: unknown; summary?: unknown };
    const gender: ReaderGender = parsed.gender === 'female' || parsed.gender === 'male' ? parsed.gender : 'all';
    const summary = String(parsed.summary || '').trim();
    return {
      gender,
      tags: cleanTags(parsed.tags, input.locale),
      summary: summary || fallback.summary,
    };
  } catch {
    return fallback;
  }
}
