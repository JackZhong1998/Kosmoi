import 'server-only';
import type { ChatMessage } from './types';
import type { Audience } from './topic-tags';
import type { PlaySnapshot, ReadingRecord } from './reading-history';
import type { StoryProject } from './stories';
import { getServiceSupabase } from './supabase';
import { buildFeedCard, type FeedCard } from './feed';
import type { Locale, ReaderGender } from './i18n';
import type { Recommendation } from './recommendation';

export type PublicationRow = {
  id: string;
  story_id: string;
  author_id: string;
  status: 'published' | 'unpublished';
  title: string;
  logline: string;
  excerpt: string;
  chapter: string;
  word_count: number;
  audience: Audience | null;
  tag_path: string[];
  topic_doc: string;
  design_doc: string;
  chapters_doc: string;
  style_doc: string;
  prose_doc: string;
  language: Locale;
  recommendation_gender: ReaderGender;
  recommendation_tags: string[];
  recommendation_summary: string;
  published_at: string;
  updated_at: string;
};

type StoryRow = {
  id: string;
  user_id: string;
  title: string;
  topic_title: string;
  audience: Audience | null;
  tag_path: string[] | null;
  topic_doc: string;
  design_doc: string;
  chapters_doc: string;
  style_doc: string;
  style_name: string;
  prose_doc: string;
  messages: ChatMessage[] | null;
  created_at: string;
  updated_at: string;
  publications?: Array<{ id: string; status: string; published_at: string }> | { id: string; status: string; published_at: string } | null;
};

export type StoryPatch = {
  title?: string;
  topicTitle?: string;
  audience?: Audience | '' | null;
  tagPath?: string[];
  topicDoc?: string;
  designDoc?: string;
  chaptersDoc?: string;
  styleDoc?: string;
  styleName?: string;
  proseDoc?: string;
  messages?: ChatMessage[];
};

function asMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ChatMessage => {
    if (!item || typeof item !== 'object') return false;
    const rec = item as ChatMessage;
    return (rec.role === 'user' || rec.role === 'assistant') && typeof rec.content === 'string' && (rec.role === 'user' || rec.content.trim() !== '');
  });
}

function publicationOf(row: StoryRow) {
  const raw = row.publications;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] || null : raw;
}

export function storyFromRow(row: StoryRow): StoryProject {
  const pub = publicationOf(row);
  return {
    id: row.id,
    title: row.title || '未命名故事',
    updatedAt: Date.parse(row.updated_at) || Date.now(),
    topicTitle: row.topic_title || '',
    topicDoc: row.topic_doc || '',
    designDoc: row.design_doc || '',
    chaptersDoc: row.chapters_doc || '',
    styleDoc: row.style_doc || '',
    styleName: row.style_name || '',
    proseDoc: row.prose_doc || '',
    messages: asMessages(row.messages),
    audience: row.audience || '',
    tagPath: Array.isArray(row.tag_path) ? row.tag_path : [],
    publishedId: pub?.id,
    publishedAt: pub?.published_at ? Date.parse(pub.published_at) : undefined,
  };
}

const STORY_SELECT = '*, publications(id, status, published_at)';
const STORY_SUMMARY_SELECT =
  'id, title, topic_title, audience, tag_path, style_name, updated_at, publications(id, status, published_at)';

function dbError(message: string, err: { message?: string } | null) {
  return new Error(err?.message ? `${message}：${err.message}` : message);
}

export function storySummaryFromRow(row: {
  id: string;
  title: string;
  topic_title: string;
  audience?: Audience | null;
  tag_path?: string[] | null;
  style_name?: string;
  updated_at: string;
  publications?: StoryRow['publications'];
}): StoryProject {
  const pub = publicationOf(row as StoryRow);
  return {
    id: row.id,
    title: row.title || '未命名故事',
    updatedAt: Date.parse(row.updated_at) || Date.now(),
    topicTitle: row.topic_title || '',
    topicDoc: '',
    designDoc: '',
    chaptersDoc: '',
    styleDoc: '',
    styleName: row.style_name || '',
    proseDoc: '',
    messages: [],
    audience: row.audience || '',
    tagPath: Array.isArray(row.tag_path) ? row.tag_path : [],
    publishedId: pub?.id,
    publishedAt: pub?.published_at ? Date.parse(pub.published_at) : undefined,
  };
}

export async function listStories(userId: string): Promise<StoryProject[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw dbError('无法读取草稿', error);
  return (data as StoryRow[] | null)?.map(storyFromRow) ?? [];
}

export async function listStorySummaries(userId: string): Promise<StoryProject[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SUMMARY_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw dbError('无法读取草稿', error);
  return (data ?? []).map((row) => storySummaryFromRow(row as Parameters<typeof storySummaryFromRow>[0]));
}

export async function getLatestStory(userId: string): Promise<StoryProject | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw dbError('无法读取草稿', error);
  return data ? storyFromRow(data as StoryRow) : null;
}

export async function openCreateWorkspace(userId: string, preferredId = ''): Promise<{ stories: StoryProject[]; story: StoryProject }> {
  const [summaries, opened] = await Promise.all([
    listStorySummaries(userId),
    preferredId ? getStory(userId, preferredId) : getLatestStory(userId),
  ]);
  const story = opened ?? (preferredId ? await getLatestStory(userId) : null) ?? (await createStoryRow(userId));
  const stories = summaries.some((item) => item.id === story.id)
    ? summaries.map((item) => (item.id === story.id ? story : item))
    : [story, ...summaries];
  return { stories, story };
}

export async function getStory(userId: string, id: string): Promise<StoryProject | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw dbError('无法读取草稿', error);
  return data ? storyFromRow(data as StoryRow) : null;
}

export async function createStoryRow(userId: string, title = '未命名故事'): Promise<StoryProject> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .insert({ user_id: userId, title })
    .select(STORY_SELECT)
    .single();
  if (error || !data) throw dbError('无法创建故事', error);
  return storyFromRow(data as StoryRow);
}

export async function updateStory(userId: string, id: string, patch: StoryPatch): Promise<StoryProject | null> {
  const existing = await getStory(userId, id);
  if (!existing) return null;
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.topicTitle !== undefined) row.topic_title = patch.topicTitle;
  if (patch.audience !== undefined) row.audience = patch.audience || null;
  if (patch.tagPath !== undefined) row.tag_path = patch.tagPath;
  if (patch.topicDoc !== undefined) row.topic_doc = patch.topicDoc;
  if (patch.designDoc !== undefined) row.design_doc = patch.designDoc;
  if (patch.chaptersDoc !== undefined) row.chapters_doc = patch.chaptersDoc;
  if (patch.styleDoc !== undefined) row.style_doc = patch.styleDoc;
  if (patch.styleName !== undefined) row.style_name = patch.styleName;
  if (patch.proseDoc !== undefined) row.prose_doc = patch.proseDoc;
  if (patch.messages !== undefined) row.messages = patch.messages;
  if (Object.keys(row).length === 0) return existing;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('stories')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select(STORY_SELECT)
    .single();
  if (error || !data) throw dbError('无法保存故事', error);
  return storyFromRow(data as StoryRow);
}

export async function publishFromStory(
  userId: string,
  input: {
    storyId: string;
    title: string;
    proseDoc: string;
    topicDoc?: string;
    designDoc?: string;
    chaptersDoc?: string;
    styleDoc?: string;
    language?: Locale;
    recommendation?: Recommendation;
  },
): Promise<{ id: string; title: string; publishedAt: number }> {
  const story = await getStory(userId, input.storyId);
  if (!story) throw new Error('找不到这篇草稿');

  const title = input.title.trim() || story.topicTitle.trim() || story.title.trim() || '未命名互动小说';
  const proseDoc = input.proseDoc || story.proseDoc;
  const card = buildFeedCard(story.publishedId || input.storyId, proseDoc, title);
  if (!card) throw new Error('还没有可以发布的正文');

  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('publications')
    .select('id, published_at')
    .eq('story_id', input.storyId)
    .maybeSingle();
  if (existingError) throw dbError('无法读取发布记录', existingError);

  const payload = {
    story_id: input.storyId,
    author_id: userId,
    status: 'published' as const,
    title: card.title,
    logline: card.logline,
    excerpt: card.excerpt,
    chapter: card.chapter,
    word_count: card.wordCount,
    audience: story.audience || null,
    tag_path: story.tagPath || [],
    topic_doc: input.topicDoc ?? story.topicDoc,
    design_doc: input.designDoc ?? story.designDoc,
    chapters_doc: input.chaptersDoc ?? story.chaptersDoc,
    style_doc: input.styleDoc ?? story.styleDoc,
    prose_doc: proseDoc,
    language: input.language || 'en',
    recommendation_gender: input.recommendation?.gender || (story.audience === 'neutral' ? 'all' : story.audience) || 'all',
    recommendation_tags: input.recommendation?.tags || (story.tagPath || []).slice(-6),
    recommendation_summary: input.recommendation?.summary || card.logline || card.excerpt.slice(0, 240),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('publications')
      .update(payload)
      .eq('id', existing.id)
      .select('id, title, published_at')
      .single();
    if (error || !data) throw dbError('无法更新发布', error);
    return {
      id: data.id,
      title: data.title,
      publishedAt: Date.parse(data.published_at) || Date.parse(existing.published_at) || Date.now(),
    };
  }

  const { data, error } = await supabase
    .from('publications')
    .insert(payload)
    .select('id, title, published_at')
    .single();
  if (error || !data) throw dbError('无法发布', error);
  return { id: data.id, title: data.title, publishedAt: Date.parse(data.published_at) || Date.now() };
}

export async function getPublication(id: string): Promise<PublicationRow | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw dbError('无法读取作品', error);
  return (data as PublicationRow | null) ?? null;
}

export async function listPublishedFeed(filters: { language?: Locale; gender?: ReaderGender } = {}): Promise<FeedCard[]> {
  const supabase = getServiceSupabase();
  let query = supabase
    .from('publications')
    .select('id, title, logline, excerpt, chapter, word_count, language, recommendation_gender, recommendation_tags, recommendation_summary')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (filters.language) query = query.eq('language', filters.language);
  if (filters.gender && filters.gender !== 'all') {
    query = query.in('recommendation_gender', [filters.gender, 'all']);
  }
  const { data, error } = await query;
  if (error) throw dbError('无法读取首页', error);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    logline: row.logline || '',
    chapter: row.chapter || '序章',
    excerpt: row.excerpt || '',
    paragraphs: String(row.excerpt || '')
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    wordCount: row.word_count || 0,
    language: row.language === 'zh' ? 'zh' : 'en',
    gender: row.recommendation_gender || 'all',
    tags: Array.isArray(row.recommendation_tags) ? row.recommendation_tags : [],
    summary: row.recommendation_summary || row.logline || '',
  }));
}

export async function getPreferences(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('language, reader_gender, onboarding_completed')
    .eq('id', userId)
    .single();
  if (error) throw dbError('无法读取偏好', error);
  return {
    language: (data.language === 'zh' ? 'zh' : 'en') as Locale,
    gender: (data.reader_gender === 'female' || data.reader_gender === 'male' ? data.reader_gender : 'all') as ReaderGender,
    completed: Boolean(data.onboarding_completed),
  };
}

export async function updatePreferences(
  userId: string,
  values: { language: Locale; gender: ReaderGender; completed?: boolean },
) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({
      language: values.language,
      reader_gender: values.gender,
      ...(values.completed !== undefined ? { onboarding_completed: values.completed } : {}),
    })
    .eq('id', userId);
  if (error) throw dbError('无法保存偏好', error);
  return { language: values.language, gender: values.gender, completed: Boolean(values.completed) };
}

function progressFromRow(row: {
  publication_id: string;
  title: string;
  chapter: string;
  node_id: string | null;
  stats: unknown;
  facts: unknown;
  path: unknown;
  explored: unknown;
  memory: unknown;
  read_at: string;
}): ReadingRecord {
  return {
    id: row.publication_id,
    title: row.title || '未命名互动小说',
    chapter: row.chapter || '',
    readAt: Date.parse(row.read_at) || Date.now(),
    nodeId: row.node_id || undefined,
    stats: row.stats && typeof row.stats === 'object' && !Array.isArray(row.stats) ? (row.stats as Record<string, number>) : {},
    facts: Array.isArray(row.facts) ? row.facts.filter((item): item is string => typeof item === 'string') : [],
    path: Array.isArray(row.path) ? (row.path as PlaySnapshot[]) : [],
    explored: Array.isArray(row.explored) ? row.explored.filter((item): item is string => typeof item === 'string') : [],
    memory: row.memory && typeof row.memory === 'object' && !Array.isArray(row.memory) ? (row.memory as Record<string, PlaySnapshot>) : {},
  };
}

export async function listReadingProgress(userId: string): Promise<ReadingRecord[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(50);
  if (error) throw dbError('无法读取阅读记录', error);
  return (data ?? []).map(progressFromRow);
}

export async function getReadingProgress(userId: string, publicationId: string): Promise<ReadingRecord | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('publication_id', publicationId)
    .maybeSingle();
  if (error) throw dbError('无法读取阅读进度', error);
  return data ? progressFromRow(data) : null;
}

export async function upsertReadingProgress(userId: string, entry: ReadingRecord): Promise<ReadingRecord> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id: userId,
        publication_id: entry.id,
        title: entry.title,
        chapter: entry.chapter || '',
        node_id: entry.nodeId || null,
        stats: entry.stats || {},
        facts: entry.facts || [],
        path: entry.path || [],
        explored: entry.explored || [],
        memory: entry.memory || {},
        read_at: new Date(entry.readAt || Date.now()).toISOString(),
      },
      { onConflict: 'user_id,publication_id' },
    )
    .select('*')
    .single();
  if (error || !data) throw dbError('无法保存阅读进度', error);
  return progressFromRow(data);
}

export async function getProfile(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('id', userId).maybeSingle();
  if (error) throw dbError('无法读取资料', error);
  return data;
}
