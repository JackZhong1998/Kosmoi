import type { ChatMessage } from './types';
import type { Audience } from './topic-tags';

export type StoryProject = {
  id: string;
  title: string;
  updatedAt: number;
  topicTitle: string;
  topicDoc: string;
  designDoc: string;
  chaptersDoc: string;
  styleDoc: string;
  styleName: string;
  proseDoc: string;
  messages: ChatMessage[];
  audience?: Audience | '';
  tagPath?: string[];
  publishedId?: string;
  publishedAt?: number;
};

export type StudioWorkspace = {
  version: 2;
  currentId: string;
  stories: StoryProject[];
  systemPrompt?: string;
};

const KEY = 'spark-studio';
const LAST_CREATE_ID_KEY = 'spark-create-id';

export function rememberCreateId(id: string) {
  if (!isStoryId(id)) return;
  try {
    localStorage.setItem(LAST_CREATE_ID_KEY, id);
  } catch {
    /* quota */
  }
}

export function readLastCreateId() {
  try {
    const id = localStorage.getItem(LAST_CREATE_ID_KEY) || '';
    return isStoryId(id) ? id : '';
  } catch {
    return '';
  }
}

export function createStoryPath(id: string) {
  return `/create/${id}`;
}

export function parseCreateStoryId(pathname: string) {
  const raw = pathname.match(/^\/create\/([^/]+)/)?.[1] || '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isStoryId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function createStory(title = '未命名故事', id?: string): StoryProject {
  return {
    id: id && isStoryId(id) ? id : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    updatedAt: Date.now(),
    topicTitle: '',
    topicDoc: '',
    designDoc: '',
    chaptersDoc: '',
    styleDoc: '',
    styleName: '',
    proseDoc: '',
    messages: [],
  };
}

export function emptyWorkspace(): StudioWorkspace {
  const first = createStory('未命名故事');
  return { version: 2, currentId: first.id, stories: [first] };
}

export function readWorkspace(): StudioWorkspace | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version === 2 && Array.isArray(data.stories) && data.currentId) {
      return data as StudioWorkspace;
    }
    return migrateV1(data);
  } catch {
    return null;
  }
}

function migrateV1(data: Record<string, unknown>): StudioWorkspace {
  const title =
    (typeof data.topicTitle === 'string' && data.topicTitle) ||
    (typeof data.topicDoc === 'string' && data.topicDoc.includes('三十天，把店救活') ? '三十天，把店救活' : '未命名故事');
  const story: StoryProject = {
    ...createStory(title),
    topicTitle: typeof data.topicTitle === 'string' ? data.topicTitle : title === '未命名故事' ? '' : title,
    topicDoc: typeof data.topicDoc === 'string' ? data.topicDoc : '',
    designDoc: typeof data.designDoc === 'string' ? data.designDoc : '',
    chaptersDoc: typeof data.chaptersDoc === 'string' ? data.chaptersDoc : '',
    styleDoc: typeof data.styleDoc === 'string' ? data.styleDoc : '',
    styleName: typeof data.styleName === 'string' ? data.styleName : '',
    proseDoc: typeof data.proseDoc === 'string' ? data.proseDoc : '',
    messages: Array.isArray(data.messages) ? (data.messages as ChatMessage[]) : [],
  };
  return {
    version: 2,
    currentId: story.id,
    stories: [story],
    systemPrompt: typeof data.systemPrompt === 'string' ? data.systemPrompt : undefined,
  };
}

export function writeWorkspace(ws: StudioWorkspace) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ws));
  } catch {
    /* quota */
  }
}

const CREATE_KEY = 'spark-create';

export function readCreateWorkspace(): StudioWorkspace | null {
  try {
    const raw = localStorage.getItem(CREATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version === 2 && Array.isArray(data.stories) && data.currentId) {
      return data as StudioWorkspace;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCreateWorkspace(ws: StudioWorkspace) {
  try {
    localStorage.setItem(CREATE_KEY, JSON.stringify(ws));
  } catch {
    /* quota */
  }
}

export function upsertStory(stories: StoryProject[], next: StoryProject): StoryProject[] {
  const i = stories.findIndex((s) => s.id === next.id);
  if (i === -1) return [...stories, next];
  const copy = stories.slice();
  copy[i] = next;
  return copy;
}

export function mergeCatalog(workspace: StudioWorkspace, catalog: StoryProject[]): StudioWorkspace {
  let stories = workspace.stories.slice();
  let currentId = workspace.currentId;
  for (const item of catalog) {
    const i = stories.findIndex((s) => s.id === item.id || (item.topicTitle && s.topicTitle === item.topicTitle));
    if (i === -1) {
      stories.push(item);
      currentId = item.id;
    } else if ((item.proseDoc?.length || 0) > (stories[i].proseDoc?.length || 0)) {
      const keepId = stories[i].id;
      stories[i] = {
        ...item,
        id: keepId,
        styleDoc: stories[i].styleDoc || item.styleDoc || '',
        styleName: stories[i].styleName || item.styleName || '',
      };
      currentId = keepId;
    }
  }
  return { ...workspace, stories, currentId };
}

export function displayTitle(story: StoryProject) {
  return story.topicTitle.trim() || story.title.trim() || '未命名故事';
}

export function listLocalProjects(): StoryProject[] {
  const seen = new Set<string>();
  const out: StoryProject[] = [];
  for (const ws of [readCreateWorkspace(), readWorkspace()]) {
    for (const story of ws?.stories ?? []) {
      if (seen.has(story.id)) continue;
      seen.add(story.id);
      out.push(story);
    }
  }
  return out;
}
