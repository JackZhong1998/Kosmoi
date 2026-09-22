'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { TopicPicker, type TopicPick } from '@/components/TopicPicker';
import {
  autoWriteProgress,
  canStartFullWrite,
  MAX_AUTO_ROUNDS,
  nextAutoStep,
} from '@/lib/auto-write';
import {
  applyDocUpdates,
  hasLockedStyle,
  lastUpdatedKind,
  lockedStyleName,
  parseAssistantPayload,
  parseCandidates,
  peelEditorTalk,
  withLockedStyle,
} from '@/lib/parse-docs';
import {
  emptyStory,
  isBookComplete,
  isPageTurnText,
  mergeProseAppend,
  storyFromProse,
  storyWordCount,
} from '@/lib/parse-story';
import { streamGenerate } from '@/lib/stream-generate';
import {
  createStory,
  createStoryPath,
  displayTitle,
  isStoryId,
  parseCreateStoryId,
  readCreateWorkspace,
  rememberCreateId,
  type StoryProject,
  upsertStory,
} from '@/lib/stories';
import { apiJson } from '@/lib/client-api';
import { loadCreateWorkspace, peekCreateWorkspace } from '@/lib/create-workspace';
import { PHASE_STARTERS } from '@/lib/system-prompt';
import type { ChatMessage, DocKind, StoryChoice, StoryData, StudioDocs } from '@/lib/types';
import type { Audience } from '@/lib/topic-tags';

type PreviewTab = 'design' | 'prose';

const PREVIEW_DOC_KINDS = new Set<DocKind>(['design', 'prose']);

function isPreviewTab(kind: DocKind | null | undefined): kind is PreviewTab {
  return kind === 'design' || kind === 'prose';
}

function previewChipLabel(kind: PreviewTab, streaming?: boolean) {
  const name = kind === 'prose' ? '正文' : '故事设计';
  return streaming ? `正在写${name}` : `查看${name}`;
}

const GREETING = `说说你脑海里的故事`;

const Reader = dynamic(() => import('@/components/Reader').then((mod) => mod.Reader), { ssr: false });
const ChatMarkdown = dynamic(() => import('@/components/ChatMarkdown').then((mod) => mod.ChatMarkdown), { ssr: false });

function docsFrom(project: Pick<StoryProject, 'topicDoc' | 'designDoc' | 'chaptersDoc' | 'styleDoc' | 'proseDoc'>): StudioDocs {
  return {
    topic: project.topicDoc,
    design: project.designDoc,
    chapters: project.chaptersDoc,
    style: project.styleDoc,
    prose: project.proseDoc,
  };
}

function pickTitle(topic: string) {
  const recBlock = (topic.split(/##\s*推荐/)[1] || '').trim();
  const rec = recBlock.match(/[《「]([^》」]{2,40})[》」]/);
  if (rec) return rec[1].trim();
  const rec2 = topic.match(/推荐[^\n《]*[《「]([^》」]+)[》」]/);
  if (rec2) return rec2[1].trim();
  const bookName = topic.match(/书名[：:]\s*[《「]([^》」]+)[》」]/);
  if (bookName) return bookName[1].trim();
  const named = [...topic.matchAll(/[#]{2,3}[^\n]*[《]([^》]+)[》]/g)].pop();
  if (named) return named[1].trim();
  const h1 = topic.match(/^#\s+《?([^》\n]+)》?/m);
  return h1 ? h1[1].trim() : '';
}

function pickStyleName(styleDoc: string) {
  return (
    lockedStyleName(styleDoc) ||
    styleDoc.match(/推荐[^\n「《]*[「《]([^」》]+)[」》]/)?.[1]?.trim() ||
    ''
  );
}

type ProjectJob = {
  busy: boolean;
  generating: boolean;
  streamText: string;
  thinkText: string;
  error: string;
};

const EMPTY_JOB: ProjectJob = { busy: false, generating: false, streamText: '', thinkText: '', error: '' };

type RunResult = 'ok' | 'aborted' | 'busy' | 'error';

function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

function replyPreview(base: { docs: StudioDocs }, text: string, fallback?: DocKind) {
  const parsed = parseAssistantPayload(text);
  let updates = parsed.updates;
  if (fallback === 'prose' && base.docs.prose.trim()) {
    updates = updates.map((update) => (update.kind === 'prose' ? { ...update, append: true } : update));
  }
  let nextDocs = applyDocUpdates(base.docs, updates);
  if (!updates.length && fallback) {
    if (fallback === 'prose' && base.docs.prose.trim()) {
      if (/^##\s+/m.test(text)) nextDocs = { ...nextDocs, prose: mergeProseAppend(base.docs.prose, text) };
    } else {
      nextDocs = { ...nextDocs, [fallback]: text };
    }
  }
  if (fallback === 'design' || nextDocs.design) {
    nextDocs = { ...nextDocs, design: peelEditorTalk(nextDocs.design).doc };
  }
  return {
    parsed,
    nextDocs,
    nextStory: storyFromProse(nextDocs.prose),
    kind: lastUpdatedKind(updates) || (updates.length === 0 ? fallback : null),
  };
}

function shortUserText(text: string) {
  const visible = text.split(/\n-------- 已锁定文风/)[0].trim();
  if (
    visible === '就用推荐的' ||
    visible === '就用推荐的。' ||
    visible === '就用推荐的，开始设计' ||
    visible === '就用推荐的，开始设计。' ||
    visible === '就用推荐的。开始设计。' ||
    visible.includes('未命名故事') ||
    /^就用《?未命名故事》?[，。、\s]*开始设计[。！]?$/.test(visible)
  ) {
    return '就用推荐的';
  }
  if (visible.startsWith('用户已用标签选定故事方向')) {
    const title = visible.match(/选定选题（[^）]+）：([^\n]+)/)?.[1]?.trim();
    const path = visible.match(/标签路径：([^\n]+)/)?.[1]?.trim();
    if (title && title !== '未命名故事') return path ? `就写这个：${title}` : title;
    return '先选题。';
  }
  if (visible.startsWith('用户想写：')) return visible.replace(/^用户想写：/, '').slice(0, 280);
  if (visible.startsWith('请写【选题】')) return '先选题。';
  if (visible.includes('请写【故事设计】') || visible.includes('用户已确认选题')) {
    const m = visible.match(/《([^》]+)》/);
    return m && m[1] !== '未命名故事' ? `就用《${m[1]}》，开始设计。` : '就用推荐的';
  }
  if (visible.includes('请写【章节卡】')) return '按这个设计写章节卡。';
  if (visible.includes('请写【文风】')) return '推荐几种写法。';
  if (visible.includes('用户选定文风')) {
    const m = visible.match(/用户选定文风「([^」]+)」/);
    return m ? `文风就用「${m[1]}」。` : '文风就用这个。';
  }
  if (visible.startsWith('用户已确认章节卡') || visible.startsWith('用户已确认故事设计和文风')) {
    return '开始写正文。';
  }
  if (visible.startsWith('继续写。') || visible.startsWith('继续往下写。')) {
    const scene = visible.match(/下一场是「([^」]+)」/)?.[1];
    if (scene) return `下一章：${scene}`;
    const missing = visible.match(/还缺这些场面：([^。]+)/)?.[1];
    const first = missing?.split('、')[0]?.trim();
    return first ? `下一章：${first}` : '写完全篇';
  }
  if (visible.startsWith('这是修改意见')) {
    return visible.replace(/^这是修改意见，不是新项目：\n\n/, '').slice(0, 280);
  }
  if (visible.length > 280) return `${visible.slice(0, 280)}…`;
  return visible;
}

function preferCandidates(primary: ReturnType<typeof parseCandidates>, fallback: ReturnType<typeof parseCandidates>) {
  return primary.length >= 2 ? primary : fallback;
}

function candidateSignature(picks: ReturnType<typeof parseCandidates>) {
  return picks.map((pick) => `${pick.n}:${pick.name}`).join('|');
}

/** 从流式稿、对话里从后往前找，取出最近一份带「候选一/二/三」的文本。 */
function latestCandidateSource(messages: ChatMessage[], live: string, fallback: string) {
  if (parseCandidates(live).length >= 2) return live;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    if (parseCandidates(messages[i].content).length >= 2) return messages[i].content;
  }
  return fallback;
}

export function CreateDesk() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <CreateDeskInner ready signedIn={false} />;
  }
  return <CreateDeskGate />;
}

function CreateDeskGate() {
  const { isLoaded, isSignedIn } = useAuth();
  return <CreateDeskInner ready={isLoaded} signedIn={Boolean(isSignedIn)} />;
}

function CreateDeskInner({ ready, signedIn }: { ready: boolean; signedIn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const routeId = parseCreateStoryId(pathname);
  const [hydrated, setHydrated] = useState(false);
  const [stories, setStories] = useState<StoryProject[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDoc, setTopicDoc] = useState('');
  const [designDoc, setDesignDoc] = useState('');
  const [chaptersDoc, setChaptersDoc] = useState('');
  const [styleDoc, setStyleDoc] = useState('');
  const [styleName, setStyleName] = useState('');
  const [proseDoc, setProseDoc] = useState('');
  const [publishedId, setPublishedId] = useState('');
  const [audience, setAudience] = useState<Audience | ''>('');
  const [tagPath, setTagPath] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [story, setStory] = useState<StoryData>(emptyStory());
  const [tab, setTab] = useState<PreviewTab>('design');
  const [pane, setPane] = useState<'chat' | 'preview'>('chat');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<Record<string, ProjectJob>>({});
  const [listOpen, setListOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const [dismissedPicks, setDismissedPicks] = useState<Record<string, string>>({});
  const chatRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSaveRef = useRef(true);
  const mountedRef = useRef(true);
  const currentIdRef = useRef('');
  const storiesRef = useRef<StoryProject[]>([]);
  const jobsRef = useRef<Record<string, ProjectJob>>({});
  const abortsRef = useRef(new Map<string, AbortController>());
  const loadedIdsRef = useRef(new Set<string>());
  const bootedRef = useRef(false);
  const autoRunRef = useRef(false);
  const autoStoryIdRef = useRef('');
  const [autoRunning, setAutoRunning] = useState(false);
  const viewRef = useRef({
    currentId: '',
    topicTitle: '',
    topicDoc: '',
    designDoc: '',
    chaptersDoc: '',
    styleDoc: '',
    styleName: '',
    proseDoc: '',
    publishedId: '',
    audience: '' as Audience | '',
    tagPath: [] as string[],
    messages: [] as ChatMessage[],
    stories: [] as StoryProject[],
  });

  currentIdRef.current = currentId;
  jobsRef.current = jobs;
  viewRef.current = {
    currentId,
    topicTitle,
    topicDoc,
    designDoc,
    chaptersDoc,
    styleDoc,
    styleName,
    proseDoc,
    publishedId,
    audience,
    tagPath,
    messages,
    stories,
  };

  const job = jobs[currentId] || EMPTY_JOB;
  const busy = job.busy;
  const streamText = job.streamText;
  const thinkText = job.thinkText;
  const error = job.error;
  const draft = drafts[currentId] ?? '';

  function snapshot(): StoryProject {
    const v = viewRef.current;
    const prev = v.stories.find((s) => s.id === v.currentId);
    return {
      id: v.currentId,
      title: v.topicTitle.trim() || prev?.title || '未命名故事',
      updatedAt: Date.now(),
      topicTitle: v.topicTitle,
      topicDoc: v.topicDoc,
      designDoc: v.designDoc,
      chaptersDoc: v.chaptersDoc,
      styleDoc: v.styleDoc,
      styleName: v.styleName,
      proseDoc: v.proseDoc,
      messages: v.messages,
      audience: v.audience || prev?.audience || '',
      tagPath: v.tagPath.length ? v.tagPath : prev?.tagPath || [],
      publishedId: v.publishedId || prev?.publishedId,
      publishedAt: prev?.publishedAt,
    };
  }

  function storyPayload(project: StoryProject) {
    return {
      title: project.title,
      topicTitle: project.topicTitle,
      audience: project.audience || null,
      tagPath: project.tagPath || [],
      topicDoc: project.topicDoc,
      designDoc: project.designDoc,
      chaptersDoc: project.chaptersDoc,
      styleDoc: project.styleDoc,
      styleName: project.styleName,
      proseDoc: project.proseDoc,
      messages: project.messages,
    };
  }

  async function saveProject(project: StoryProject) {
    if (!isStoryId(project.id)) return;
    await apiJson(`/api/stories/${project.id}`, {
      method: 'PATCH',
      body: JSON.stringify(storyPayload(project)),
    });
  }

  function queueSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject(snapshot()).catch(() => null);
    }, 800);
  }

  async function flushSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const project = snapshot();
    if (!isStoryId(project.id)) return;
    await saveProject(project).catch(() => null);
  }

  function setJob(storyId: string, patch: Partial<ProjectJob>) {
    const nextJob = { ...(jobsRef.current[storyId] || EMPTY_JOB), ...patch };
    jobsRef.current = { ...jobsRef.current, [storyId]: nextJob };
    if (!mountedRef.current) return;
    setJobs(jobsRef.current);
  }

  function replaceStories(next: StoryProject[]) {
    storiesRef.current = next;
    if (mountedRef.current) setStories(next);
  }

  function stopAutoWrite() {
    autoRunRef.current = false;
    const id = autoStoryIdRef.current || currentIdRef.current;
    if (id) abortsRef.current.get(id)?.abort();
    if (mountedRef.current) setAutoRunning(false);
  }

  function applyProject(project: StoryProject) {
    loadedIdsRef.current.add(project.id);
    rememberCreateId(project.id);
    currentIdRef.current = project.id;
    setCurrentId(project.id);
    setTopicTitle(project.topicTitle);
    setTopicDoc(project.topicDoc);
    const designDoc = peelEditorTalk(project.designDoc || '').doc;
    setDesignDoc(designDoc);
    setChaptersDoc(project.chaptersDoc || '');
    setStyleDoc(project.styleDoc || '');
    setStyleName(project.styleName || lockedStyleName(project.styleDoc || ''));
    setProseDoc(project.proseDoc);
    setPublishedId(project.publishedId || '');
    setAudience(project.audience || '');
    setTagPath(project.tagPath || []);
    setMessages(project.messages || []);
    setStory(storyFromProse(project.proseDoc));
    setTab(project.proseDoc ? 'prose' : 'design');
    viewRef.current = {
      currentId: project.id,
      topicTitle: project.topicTitle,
      topicDoc: project.topicDoc,
      designDoc,
      chaptersDoc: project.chaptersDoc || '',
      styleDoc: project.styleDoc || '',
      styleName: project.styleName || lockedStyleName(project.styleDoc || ''),
      proseDoc: project.proseDoc,
      publishedId: project.publishedId || '',
      audience: project.audience || '',
      tagPath: project.tagPath || [],
      messages: project.messages || [],
      stories: storiesRef.current,
    };
  }

  function openStory(project: StoryProject, list = storiesRef.current) {
    if (project.id !== currentIdRef.current) stopAutoWrite();
    replaceStories(list);
    applyProject(project);
    setPlayOpen(false);
    if (pathname !== createStoryPath(project.id)) {
      router.replace(createStoryPath(project.id));
    }
  }

  async function projectForId(id: string, list: StoryProject[]) {
    const existing = list.find((item) => item.id === id);
    if (existing && loadedIdsRef.current.has(id)) return { project: existing, stories: list };
    const one = await apiJson<{ story: StoryProject }>(`/api/stories/${id}`);
    loadedIdsRef.current.add(one.story.id);
    return { project: one.story, stories: upsertStory(list, one.story) };
  }

  function bootWorkspace(list: StoryProject[], project: StoryProject) {
    skipSaveRef.current = true;
    storiesRef.current = list;
    loadedIdsRef.current.add(project.id);
    setStories(list);
    applyProject(project);
    if (pathname !== createStoryPath(project.id)) {
      router.replace(createStoryPath(project.id));
    }
    bootedRef.current = true;
    setHydrated(true);
    setLoadError('');
  }

  useLayoutEffect(() => {
    mountedRef.current = true;
    if (!ready) return;
    const peeked = peekCreateWorkspace(routeId);
    if (peeked) bootWorkspace(peeked.stories, peeked.story);
  }, [ready]);

  useEffect(() => {
    mountedRef.current = true;
    if (!ready) return;
    let cancelled = false;
    (async () => {
      if (!signedIn) {
        if (bootedRef.current) return;
        const local = readCreateWorkspace();
        let list = local?.stories?.length ? local.stories.slice() : [];
        let project = (routeId && list.find((item) => item.id === routeId)) || list[0];
        if (!project) {
          project = createStory();
          list = [project];
        }
        list.forEach((item) => loadedIdsRef.current.add(item.id));
        bootWorkspace(list, project);
        return;
      }
      try {
        const data = await loadCreateWorkspace(routeId);
        if (cancelled || !mountedRef.current) return;
        if (bootedRef.current && currentIdRef.current === data.story.id) return;
        bootWorkspace(data.stories, data.story);
      } catch {
        if (cancelled || !mountedRef.current || bootedRef.current) return;
        const local = readCreateWorkspace();
        let list = local?.stories?.length ? local.stories.slice() : [];
        let project = (routeId && list.find((item) => item.id === routeId)) || list[0];
        if (!project) {
          project = createStory();
          list = [project];
        }
        list.forEach((item) => loadedIdsRef.current.add(item.id));
        bootWorkspace(list, project);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, signedIn]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      autoRunRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      for (const ctrl of abortsRef.current.values()) ctrl.abort();
      abortsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !isStoryId(routeId) || routeId === currentIdRef.current) return;
    let cancelled = false;
    (async () => {
      await flushSave();
      if (cancelled) return;
      const saved = upsertStory(storiesRef.current, snapshot());
      loadedIdsRef.current.add(currentIdRef.current);
      try {
        const { project, stories: next } = await projectForId(routeId, saved);
        if (cancelled) return;
        skipSaveRef.current = true;
        openStory(project, next);
      } catch {
        if (!cancelled && storiesRef.current[0]) {
          skipSaveRef.current = true;
          openStory(storiesRef.current[0], storiesRef.current);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, routeId]);

  useEffect(() => {
    if (!hydrated || !currentId) return;
    const next = upsertStory(storiesRef.current, snapshot());
    storiesRef.current = next;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    queueSave();
  }, [
    hydrated,
    currentId,
    topicTitle,
    topicDoc,
    designDoc,
    chaptersDoc,
    styleDoc,
    styleName,
    proseDoc,
    messages,
    publishedId,
    audience,
    tagPath,
    stories,
  ]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamText]);

  useEffect(() => {
    if (!listOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (brandRef.current?.contains(event.target as Node)) return;
      setListOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [listOpen]);

  useEffect(() => {
    document.body.classList.toggle('desk-play-open', playOpen);
    return () => document.body.classList.remove('desk-play-open');
  }, [playOpen]);

  useEffect(() => {
    if (!playOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPlayOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playOpen]);

  const styleLocked = hasLockedStyle(styleDoc);
  const nodeCount = Object.keys(story.nodes).length;
  const words = useMemo(() => storyWordCount(story), [story]);
  const docs = docsFrom({ topicDoc, designDoc, chaptersDoc, styleDoc, proseDoc });
  const currentDoc = docs[tab];
  const canPublish = nodeCount > 0 && !!proseDoc.trim() && !!(topicTitle.trim() || story.meta?.title);
  const bookTitle = topicTitle.trim() || story.meta?.title || '未命名故事';
  const showPicker = hydrated && messages.length === 0 && !streamText && !topicDoc.trim();

  function applyDocs(next: StudioDocs) {
    setTopicDoc(next.topic);
    setDesignDoc(next.design);
    setChaptersDoc(next.chapters);
    setStyleDoc(next.style);
    if (hasLockedStyle(next.style)) {
      const name = lockedStyleName(next.style);
      if (name) setStyleName(name);
    }
    setProseDoc(next.prose);
    const title = pickTitle(next.topic);
    if (title) setTopicTitle(title);
  }

  function applyGeneration(
    storyId: string,
    nextDocs: StudioDocs,
    nextStory: StoryData,
    kind: DocKind | null | undefined,
  ) {
    if (currentIdRef.current === storyId) {
      applyDocs(nextDocs);
      setStory(nextStory);
      if (isPreviewTab(kind)) setTab(kind);
      const title = pickTitle(nextDocs.topic);
      viewRef.current = {
        ...viewRef.current,
        topicDoc: nextDocs.topic,
        designDoc: nextDocs.design,
        chaptersDoc: nextDocs.chapters,
        styleDoc: nextDocs.style,
        styleName: hasLockedStyle(nextDocs.style)
          ? lockedStyleName(nextDocs.style) || viewRef.current.styleName
          : viewRef.current.styleName,
        proseDoc: nextDocs.prose,
        topicTitle: title || viewRef.current.topicTitle,
      };
      return;
    }
    const prev = storiesRef.current.find((s) => s.id === storyId);
    if (!prev) return;
    const title = pickTitle(nextDocs.topic);
    replaceStories(
      upsertStory(storiesRef.current, {
        ...prev,
        topicDoc: nextDocs.topic,
        designDoc: nextDocs.design,
        chaptersDoc: nextDocs.chapters,
        styleDoc: nextDocs.style,
        styleName: hasLockedStyle(nextDocs.style) ? lockedStyleName(nextDocs.style) || prev.styleName : prev.styleName,
        proseDoc: nextDocs.prose,
        topicTitle: title || prev.topicTitle,
        title: title || prev.title,
        updatedAt: Date.now(),
      }),
    );
  }

  function commitMessages(storyId: string, nextMessages: ChatMessage[]) {
    if (currentIdRef.current === storyId) {
      viewRef.current = { ...viewRef.current, messages: nextMessages };
      setMessages(nextMessages);
      return;
    }
    const prev = storiesRef.current.find((s) => s.id === storyId);
    if (!prev) return;
    replaceStories(upsertStory(storiesRef.current, { ...prev, messages: nextMessages, updatedAt: Date.now() }));
  }

  async function persist(kind: DocKind, content: string, storyId: string) {
    if (!content.trim() || !isStoryId(storyId)) return;
    await apiJson(`/api/stories/${storyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ [kind === 'topic' ? 'topicDoc' : kind === 'design' ? 'designDoc' : kind === 'chapters' ? 'chaptersDoc' : kind === 'style' ? 'styleDoc' : 'proseDoc']: content }),
    }).catch(() => null);
  }

  async function run(
    userText: string,
    fallback?: DocKind,
    opts?: { messagesForModel?: ChatMessage[] },
  ): Promise<RunResult> {
    const storyId = currentIdRef.current;
    if (!storyId || jobsRef.current[storyId]?.busy || !userText.trim()) return 'busy';
    const history: ChatMessage[] = [...viewRef.current.messages, { role: 'user', content: userText }];
    const modelMessages = opts?.messagesForModel ?? history;
    const base = {
      docs: docsFrom({
        topicDoc: viewRef.current.topicDoc,
        designDoc: viewRef.current.designDoc,
        chaptersDoc: viewRef.current.chaptersDoc,
        styleDoc: viewRef.current.styleDoc,
        proseDoc: viewRef.current.proseDoc,
      }),
    };
    const ctrl = new AbortController();
    abortsRef.current.set(storyId, ctrl);
    setJob(storyId, { busy: true, generating: true, streamText: '', thinkText: '', error: '' });
    commitMessages(storyId, history);
    let assembled = '';
    let result: RunResult = 'ok';

    async function settlePartial() {
      if (!assembled) return;
      const preview = replyPreview(base, assembled, fallback);
      applyGeneration(storyId, preview.nextDocs, preview.nextStory, preview.kind);
      commitMessages(storyId, [...history, { role: 'assistant', content: assembled }]);
      setJob(storyId, { streamText: '', thinkText: '' });
      for (const kind of ['topic', 'design', 'chapters', 'style', 'prose'] as DocKind[]) {
        if (preview.nextDocs[kind] !== base.docs[kind]) await persist(kind, preview.nextDocs[kind], storyId);
      }
      if (currentIdRef.current === storyId) await flushSave();
      else {
        const item = storiesRef.current.find((s) => s.id === storyId);
        if (item) await saveProject(item).catch(() => null);
      }
    }

    try {
      const full = await streamGenerate(
        '',
        modelMessages,
        (text) => {
          if (ctrl.signal.aborted) return;
          assembled = text;
          setJob(storyId, { streamText: text });
          const preview = replyPreview(base, text, fallback);
          applyGeneration(storyId, preview.nextDocs, preview.nextStory, preview.kind);
        },
        (thinking) => {
          if (ctrl.signal.aborted) return;
          setJob(storyId, { thinkText: thinking });
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) {
        result = 'aborted';
        await settlePartial();
        return result;
      }
      const preview = replyPreview(base, full, fallback);
      applyGeneration(storyId, preview.nextDocs, preview.nextStory, preview.kind);
      commitMessages(storyId, [...history, { role: 'assistant', content: full }]);
      setJob(storyId, { streamText: '', thinkText: '', error: '' });
      for (const kind of ['topic', 'design', 'chapters', 'style', 'prose'] as DocKind[]) {
        if (preview.nextDocs[kind] !== base.docs[kind]) await persist(kind, preview.nextDocs[kind], storyId);
      }
      if (currentIdRef.current === storyId) await flushSave();
      else {
        const item = storiesRef.current.find((s) => s.id === storyId);
        if (item) await saveProject(item).catch(() => null);
      }
    } catch (err) {
      if (isAbortError(err) || ctrl.signal.aborted) {
        result = 'aborted';
        await settlePartial();
        return result;
      }
      result = 'error';
      setJob(storyId, { error: err instanceof Error ? err.message : '生成失败' });
      if (assembled) {
        commitMessages(storyId, [...history, { role: 'assistant', content: assembled }]);
        setJob(storyId, { streamText: '', thinkText: '' });
        const preview = replyPreview(base, assembled, fallback);
        for (const kind of ['topic', 'design', 'chapters', 'style', 'prose'] as DocKind[]) {
          if (preview.nextDocs[kind] !== base.docs[kind]) await persist(kind, preview.nextDocs[kind], storyId);
        }
        if (currentIdRef.current === storyId) await flushSave();
      }
    } finally {
      if (abortsRef.current.get(storyId) === ctrl) {
        abortsRef.current.delete(storyId);
        setJob(storyId, { busy: false, generating: false });
      }
    }
    return result;
  }

  async function startAutoWrite() {
    const storyId = currentIdRef.current;
    if (!storyId || autoRunRef.current || jobsRef.current[storyId]?.busy) return;
    autoRunRef.current = true;
    autoStoryIdRef.current = storyId;
    setAutoRunning(true);
    let stall = 0;
    let lastCount = Object.keys(storyFromProse(viewRef.current.proseDoc).nodes).length;
    try {
      for (let i = 0; i < MAX_AUTO_ROUNDS; i++) {
        if (!autoRunRef.current || currentIdRef.current !== storyId) return;
        const v = viewRef.current;
        const currentStory = storyFromProse(v.proseDoc);
        const lastAssist = [...v.messages].reverse().find((msg) => msg.role === 'assistant')?.content || '';
        const title =
          pickTitle(v.topicDoc) ||
          parseCandidates(v.topicDoc)[0]?.name ||
          parseCandidates(lastAssist)[0]?.name ||
          v.topicTitle.trim() ||
          '未命名故事';
        const step = nextAutoStep({
          topicDoc: v.topicDoc,
          designDoc: v.designDoc,
          styleDoc: v.styleDoc,
          proseDoc: v.proseDoc,
          story: currentStory,
          title,
          styleName: v.styleName || pickStyleName(v.styleDoc) || parseCandidates(v.styleDoc)[0]?.name || '烟火白话',
        });
        if (step.kind === 'needTopic') return;
        if (step.kind === 'done') {
          if (i > 0) {
            commitMessages(storyId, [
              ...v.messages,
              { role: 'assistant', content: '全书场面已经写齐。可以去预览里读，或继续改某一场。' },
            ]);
          }
          return;
        }
        const result = await run(step.prompt, step.fallback, {
          messagesForModel: step.slimHistory,
        });
        if (result !== 'ok') return;
        if (step.kind === 'proseStart' || step.kind === 'proseContinue') {
          const nextCount = Object.keys(storyFromProse(viewRef.current.proseDoc).nodes).length;
          if (nextCount <= lastCount) stall += 1;
          else stall = 0;
          lastCount = nextCount;
          if (stall >= 2) {
            setJob(storyId, { error: '这一轮没写出新场面' });
            return;
          }
        }
      }
      if (autoRunRef.current && currentIdRef.current === storyId) {
        setJob(storyId, { error: '写完全篇已达轮次上限，可再点一次接着写' });
      }
    } finally {
      if (autoStoryIdRef.current === storyId) autoStoryIdRef.current = '';
      autoRunRef.current = false;
      if (mountedRef.current) setAutoRunning(false);
    }
  }

  function openPreview(kind: PreviewTab) {
    setTab(kind);
    setPane('preview');
  }

  function openPlay() {
    setTab('prose');
    setPane('preview');
    setPlayOpen(true);
  }

  function requestPlayWrite(req: { fromTitle: string; choice: StoryChoice }) {
    setTab('prose');
    setPane('preview');
    if (jobsRef.current[currentIdRef.current]?.busy || autoRunRef.current) return;
    const pageTurn = Boolean(req.choice.pageTurn) || isPageTurnText(req.choice.text);
    run(
      withLockedStyle(
        PHASE_STARTERS.playContinue(req.fromTitle, req.choice.next, req.choice.text, pageTurn),
        viewRef.current.styleDoc,
      ),
      'prose',
    );
  }

  function confirmTopic(pick: TopicPick) {
    if (busy || autoRunning) return;
    setAudience(pick.audience);
    setTagPath(pick.path);
    viewRef.current = { ...viewRef.current, audience: pick.audience, tagPath: pick.path };
    run(PHASE_STARTERS.tagPick(pick.audienceName, pick.path, pick.topic.style, pick.topic.title), 'topic');
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text || autoRunRef.current) return;
    const id = currentIdRef.current;
    setDrafts((prev) => ({ ...prev, [id]: '' }));
    if (!topicDoc.trim()) {
      run(PHASE_STARTERS.consumeStart(text), 'topic');
      return;
    }
    const payload = /改|重写|文风|不要|更|删|加/.test(text) ? PHASE_STARTERS.revise(text) : text;
    run(payload, designDoc.trim() ? undefined : 'topic');
  }

  async function newStory() {
    try {
      await flushSave();
      const created = await apiJson<{ story: StoryProject }>('/api/stories', { method: 'POST' });
      skipSaveRef.current = true;
      const next = [...upsertStory(storiesRef.current, snapshot()), created.story];
      openStory(created.story, next);
      setListOpen(false);
      setPane('chat');
    } catch (err) {
      setJob(currentIdRef.current, { error: err instanceof Error ? err.message : '无法创建故事' });
    }
  }

  async function switchStory(id: string) {
    if (id === currentIdRef.current) {
      setListOpen(false);
      return;
    }
    await flushSave();
    loadedIdsRef.current.add(currentIdRef.current);
    const next = upsertStory(storiesRef.current, snapshot());
    try {
      const { project, stories: opened } = await projectForId(id, next);
      skipSaveRef.current = true;
      openStory(project, opened);
      setListOpen(false);
    } catch (err) {
      setJob(currentIdRef.current, { error: err instanceof Error ? err.message : '无法打开故事' });
    }
  }

  async function publish() {
    if (!canPublish || busy || autoRunning) return;
    const storyId = currentIdRef.current;
    setJob(storyId, { busy: true, error: '' });
    try {
      await flushSave();
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          title: bookTitle,
          proseDoc,
          topicDoc,
          designDoc,
          chaptersDoc,
          styleDoc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发布失败');
      setPublishedId(data.id);
      viewRef.current = { ...viewRef.current, publishedId: data.id };
      replaceStories(upsertStory(storiesRef.current, { ...snapshot(), publishedId: data.id, publishedAt: data.publishedAt }));
    } catch (err) {
      setJob(storyId, { error: err instanceof Error ? err.message : '发布失败' });
    } finally {
      setJob(storyId, { busy: false });
    }
  }

  const writingProse = !!proseDoc.trim();
  const liveText = streamText.trim();
  const topicPicks = !designDoc.trim()
    ? preferCandidates(
        parseCandidates(latestCandidateSource(messages, liveText, topicDoc)),
        parseCandidates(topicDoc),
      )
    : [];
  const stylePicks =
    designDoc.trim() && !styleLocked && !writingProse
      ? preferCandidates(parseCandidates(liveText), parseCandidates(styleDoc))
      : [];
  const pickKind = topicPicks.length >= 2 ? 'topic' : stylePicks.length >= 2 ? 'style' : null;
  const rawPicks = pickKind === 'topic' ? topicPicks : pickKind === 'style' ? stylePicks : [];
  const pickKey = pickKind ? `${currentId}:${pickKind}` : '';
  const pickSignature = candidateSignature(rawPicks);
  const candidatePicks =
    pickKind && pickSignature && dismissedPicks[pickKey] !== pickSignature
      ? rawPicks.map((pick) => ({
          key: `${pickKind}-${pick.n}`,
          label: `候选${pick.n}`,
          name: pick.name,
          run: () => {
            setDismissedPicks((prev) => ({ ...prev, [pickKey]: pickSignature }));
            if (pickKind === 'topic') run(PHASE_STARTERS.design(pick.name), 'design');
            else run(PHASE_STARTERS.lockStyle(pick.name), 'style');
          },
        }))
      : [];

  const nextAction =
    candidatePicks.length > 0 ||
    (dismissedPicks[`${currentId}:topic`] && !designDoc.trim()) ||
    (dismissedPicks[`${currentId}:style`] && !!designDoc.trim() && !styleLocked && !writingProse)
      ? null
      : !topicDoc
        ? null
        : !designDoc
          ? { label: '就用推荐的', run: () => run('就用推荐的', 'design') }
          : writingProse
            ? {
                label: '继续往下写',
                run: () =>
                  run(
                    withLockedStyle(
                      PHASE_STARTERS.proseContinue(),
                      styleDoc,
                    ),
                    'prose',
                  ),
              }
            : !styleDoc
            ? { label: '推荐几种写法', run: () => run(PHASE_STARTERS.style(bookTitle), 'style') }
            : !styleLocked
              ? {
                  label: `锁定「${pickStyleName(styleDoc) || '推荐写法'}」并准备开写`,
                  run: () => run(PHASE_STARTERS.lockStyle(pickStyleName(styleDoc) || '烟火白话'), 'style'),
                }
              : !proseDoc
                ? { label: '开始写正文', run: () => run(withLockedStyle(PHASE_STARTERS.proseStart, styleDoc), 'prose') }
                : {
                    label: '继续往下写',
                    run: () =>
                      run(
                        withLockedStyle(
                          PHASE_STARTERS.proseContinue(),
                          styleDoc,
                        ),
                        'prose',
                      ),
                  };

  const bookComplete = isBookComplete(designDoc, story, styleLocked);
  const showFullWrite = canStartFullWrite({
    showPicker,
    topicDoc,
    hasTopicPicks: topicPicks.length >= 2,
    complete: bookComplete,
  });
  const fullWriteProgress = autoWriteProgress(designDoc, story);

  if (loadError) {
    return (
      <div className="consume-empty">
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <div className={`desk${playOpen ? ' play-open' : ''}`}>
      <header className="desk-bar">
        <div className="desk-brand" ref={brandRef}>
          <button
            type="button"
            className={`desk-story${listOpen ? ' open' : ''}`}
            aria-expanded={listOpen}
            aria-haspopup="menu"
            aria-label={`当前故事 ${bookTitle}，点开切换`}
            disabled={!hydrated}
            onClick={() => setListOpen((open) => !open)}
          >
            <span className="desk-story-copy">
            
              <b>{bookTitle}</b>
            </span>
            <svg className="desk-caret" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 9.5 12 15.5 18 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {listOpen ? (
            <div className="desk-menu">
              {stories.map((item) => (
                <button key={item.id} type="button" className={item.id === currentId ? 'on' : ''} onClick={() => switchStory(item.id)}>
                  {displayTitle(item.id === currentId ? snapshot() : item)}
                  {jobs[item.id]?.busy ? <em>正在写</em> : item.publishedId ? <em>已发布</em> : null}
                </button>
              ))}
              <button type="button" className="desk-new" onClick={newStory}>
                ＋ 新故事
              </button>
            </div>
          ) : null}
        </div>
        <div className="desk-bar-actions">
          <div className="desk-paneswitch" role="tablist" aria-label="对话或预览">
            <button type="button" className={pane === 'chat' ? 'on' : ''} onClick={() => setPane('chat')}>
              对话
            </button>
            <button type="button" className={pane === 'preview' ? 'on' : ''} onClick={() => setPane('preview')}>
              预览
            </button>
          </div>
          <button type="button" className="desk-publish" disabled={busy || autoRunning || !canPublish} onClick={publish}>
            {publishedId ? '更新到首页' : '发布'}
          </button>
        </div>
      </header>

      <div className={`desk-body${pane === 'preview' ? ' show-preview' : ' show-chat'}${showPicker ? ' picking' : ''}`}>
        <section className="desk-chat" aria-label="和作家对话">
          <div className={`desk-log${showPicker ? ' has-picker' : ''}`} ref={chatRef}>
            {showPicker ? <TopicPicker key={currentId} onConfirm={confirmTopic} /> : null}
            {!hydrated ? (
              <div className="desk-bubble assistant">
                <p>正在打开创作台…</p>
              </div>
            ) : messages.length === 0 && !streamText && !showPicker ? (
              <div className="desk-bubble assistant">
                <ChatMarkdown text={GREETING} />
              </div>
            ) : null}
            {messages.map((msg, i) => (
              <CreateBubble key={`${msg.role}-${i}`} message={msg} onOpenDoc={openPreview} />
            ))}
            {thinkText && busy ? (
              <div className="desk-think">
                <span>正在想</span>
                <pre>{thinkText.slice(-800)}</pre>
              </div>
            ) : null}
            {streamText ? <CreateBubble message={{ role: 'assistant', content: streamText }} onOpenDoc={openPreview} streaming /> : null}
          </div>
          <div className="desk-composer">
            {autoRunning ? (
              <div className="desk-fullwrite-row">
                <p className="desk-fullwrite-progress">
                  {fullWriteProgress.missing > 0
                    ? `正在写完全篇 · 已写 ${fullWriteProgress.written} 场 · 还缺 ${fullWriteProgress.missing} 场`
                    : fullWriteProgress.written > 0
                      ? `正在写完全篇 · 已写 ${fullWriteProgress.written} 场`
                      : '正在写完全篇'}
                </p>
                <button type="button" className="desk-fullwrite stop" onClick={stopAutoWrite}>
                  停止写完全篇
                </button>
              </div>
            ) : (
              <div className="desk-fullwrite-row">
                {candidatePicks.length > 0 ? (
                  <div className="desk-picks" role="group" aria-label={designDoc.trim() ? '选文风' : '选题'}>
                    {candidatePicks.map((pick) => (
                      <button key={pick.key} type="button" className="desk-pick" disabled={busy} onClick={pick.run}>
                        <span>{pick.label}</span>
                        {pick.name ? <small>{pick.name}</small> : null}
                      </button>
                    ))}
                  </div>
                ) : nextAction ? (
                  <button type="button" className="desk-next" disabled={busy} onClick={nextAction.run}>
                    {nextAction.label}
                  </button>
                ) : null}
                {showFullWrite ? (
                  <button type="button" className="desk-fullwrite" disabled={busy} onClick={() => void startAutoWrite()}>
                    写完全篇
                  </button>
                ) : null}
              </div>
            )}
            <div className="desk-input">
              <textarea
                value={draft}
                onChange={(e) => {
                  const id = currentIdRef.current;
                  if (!id) return;
                  setDrafts((prev) => ({ ...prev, [id]: e.target.value }));
                }}
                placeholder={topicDoc ? '改设定、改文风、或接着聊' : '你想写什么样的故事'}
                rows={3}
                disabled={autoRunning || !hydrated}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendDraft();
                  }
                }}
              />
              <button type="button" className="primary desk-send" disabled={!hydrated || busy || autoRunning || !draft.trim()} onClick={sendDraft}>
                发送
              </button>
            </div>
            {error ? <p className="desk-error">{error}</p> : null}
          </div>
        </section>

        <section className="desk-preview" aria-label="故事预览">
          <div className="desk-tabs">
            <div className="desk-tabs-list" role="tablist" aria-label="预览文档">
              {([
                ['design', '故事设计'],
                ['prose', nodeCount ? `正文 ${words}` : '正文'],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="desk-play" aria-label="全屏阅读" title="全屏阅读" onClick={openPlay}>
              <IconFullscreen />
            </button>
          </div>
          {playOpen || (tab === 'prose' && proseDoc.trim() && nodeCount > 0) ? (
            nodeCount > 0 ? (
              <div className={`desk-reader${playOpen ? ' play-open' : ''}`}>
                <Reader
                  key={`${currentId}${playOpen ? '-play' : ''}`}
                  story={story}
                  authorPreview={!playOpen}
                  defaultTocOpen={false}
                  writing={job.generating}
                  writeError={error}
                  onWriteMissing={requestPlayWrite}
                  onBack={playOpen ? () => setPlayOpen(false) : undefined}
                  backLabel="退出全屏"
                />
              </div>
            ) : (
              <div className="desk-reader play-open">
                <div className="reader-empty">
                  <header className="reader-bar">
                    <button type="button" className="reader-icon" aria-label="退出全屏" onClick={() => setPlayOpen(false)}>
                      <IconPlayBack />
                    </button>
                    <div className="reader-titles">
                      <b>{bookTitle}</b>
                      <span>{job.generating ? '正在写' : '还没有正文'}</span>
                    </div>
                  </header>
                  <div>
                    <p>{job.generating ? '作家正在写这一场。写好会自己打开。' : '还没有正文。'}</p>
                    {job.generating ? <p className="reader-writing">正在写</p> : null}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className={`desk-doc${currentDoc ? '' : ' empty'}`}>
              {currentDoc ? (
                <div className="desk-paper">
                  <ChatMarkdown text={currentDoc} />
                </div>
              ) : (
                <div className="desk-placeholder">
                  <p>还没有{tab === 'prose' ? '正文' : '故事设计'}。</p>
                  <p>选题和文风会写在对话里。故事设计和正文写好后，点对话里的按钮再来看。</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function IconFullscreen() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlayBack() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CreateBubble({
  message,
  onOpenDoc,
  streaming,
}: {
  message: ChatMessage;
  onOpenDoc: (kind: PreviewTab) => void;
  streaming?: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="desk-bubble user">
        <ChatMarkdown text={shortUserText(message.content)} />
      </div>
    );
  }
  const parsed = parseAssistantPayload(message.content);
  const inlineDocs = parsed.updates.filter((u) => u.content && !PREVIEW_DOC_KINDS.has(u.kind));
  const previewKinds = [...new Set(parsed.updates.filter((u) => u.content).map((u) => u.kind).filter(isPreviewTab))];
  const firstDoc = message.content.search(/===DOC:(topic|design|chapters|style|prose)\+?===/);
  const lastClose = message.content.lastIndexOf('===END_DOC===');
  const afterStart = lastClose === -1 ? message.content.length : lastClose + '===END_DOC==='.length;
  const chatBefore = (firstDoc === -1 ? parsed.chat : message.content.slice(0, firstDoc))
    .replace(/===STORY_PATCH===[\s\S]*?(?:===END_STORY_PATCH===|$)/g, '')
    .trim();
  const chatAfter =
    firstDoc === -1
      ? ''
      : [message.content.slice(afterStart), parsed.talk]
          .map((part) =>
            part
              .replace(/===STORY_PATCH===[\s\S]*?(?:===END_STORY_PATCH===|$)/g, '')
              .replace(/===DOC:(topic|design|chapters|style|prose)\+?===/g, '')
              .trim(),
          )
          .filter(Boolean)
          .join('\n\n');
  const showRaw = !chatBefore && !chatAfter && inlineDocs.length === 0 && previewKinds.length === 0;
  return (
    <div className={`desk-bubble assistant${streaming ? ' streaming' : ''}`}>
      {chatBefore ? <ChatMarkdown text={chatBefore} /> : null}
      {inlineDocs.map((doc, i) => (
        <ChatMarkdown key={`${doc.kind}-${i}`} text={doc.content} />
      ))}
      {chatAfter ? <ChatMarkdown text={chatAfter} /> : null}
      {showRaw ? <ChatMarkdown text={message.content} /> : null}
      {previewKinds.length > 0 ? (
        <div className="desk-chips">
          {previewKinds.map((kind) => (
            <button key={kind} type="button" className="desk-chip" onClick={() => onOpenDoc(kind)}>
              {previewChipLabel(kind, streaming)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
