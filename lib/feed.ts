import { emptyStory, mergeStory, renderBody, storyWordCount } from './parse-story';
import type { Locale, ReaderGender } from './i18n';

export type FeedCard = {
  id: string;
  title: string;
  logline: string;
  chapter: string;
  excerpt: string;
  paragraphs: string[];
  wordCount: number;
  language?: Locale;
  gender?: ReaderGender;
  tags?: string[];
  summary?: string;
};

const EXCERPT_CHARS = 560;

function pickLogline(prose: string, fromMeta = '') {
  const raw =
    fromMeta ||
    prose.match(/卖点[：:]\s*(.+)$/m)?.[1]?.trim() ||
    prose.match(/简介[：:]\s*(.+)$/m)?.[1]?.trim() ||
    '';
  return raw.replace(/^[「『“"'《]|[」』”"'》]$/g, '').trim();
}

export function buildFeedCard(id: string, prose: string, fallbackTitle = ''): FeedCard | null {
  const story = mergeStory(emptyStory(), prose);
  const startId = story.meta?.start || Object.keys(story.nodes)[0];
  const node = startId ? story.nodes[startId] : null;
  if (!node?.body) return null;
  const body = renderBody(node.body, new Set(), {});
  const paragraphs = body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  let excerpt = '';
  const kept: string[] = [];
  for (const p of paragraphs) {
    if (excerpt.length >= EXCERPT_CHARS) break;
    kept.push(p);
    excerpt += (excerpt ? '\n\n' : '') + p;
  }
  const metaTitle = story.meta?.title?.trim();
  const title =
    (metaTitle && metaTitle !== '未命名互动小说' ? metaTitle : '') ||
    fallbackTitle.trim() ||
    '未命名互动小说';
  return {
    id,
    title,
    logline: pickLogline(prose, story.meta?.logline || ''),
    chapter: node.chapter?.includes('序章') ? '序章' : node.chapter || '序章',
    excerpt,
    paragraphs: kept,
    wordCount: storyWordCount(story),
  };
}
