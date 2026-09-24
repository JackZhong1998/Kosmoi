export type PlaySnapshot = {
  nodeId: string;
  stats: Record<string, number>;
  facts: string[];
  via: string[];
};

export type ReadingRecord = {
  id: string;
  title: string;
  chapter: string;
  readAt: number;
  nodeId?: string;
  stats?: Record<string, number>;
  facts?: string[];
  path?: PlaySnapshot[];
  explored?: string[];
  memory?: Record<string, PlaySnapshot>;
};

const KEY = 'spark-read-history';
const MAX = 50;

function isSnapshot(item: unknown): item is PlaySnapshot {
  if (!item || typeof item !== 'object') return false;
  const row = item as PlaySnapshot;
  return (
    typeof row.nodeId === 'string' &&
    !!row.stats &&
    typeof row.stats === 'object' &&
    Array.isArray(row.facts) &&
    Array.isArray(row.via)
  );
}

export function readHistory(): ReadingRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is ReadingRecord =>
        !!item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.readAt === 'number',
    );
  } catch {
    return [];
  }
}

export function loadProgress(id: string): ReadingRecord | null {
  if (!id) return null;
  return readHistory().find((item) => item.id === id) || null;
}

export async function loadProgressAsync(id: string): Promise<ReadingRecord | null> {
  if (!id) return null;
  try {
    const res = await fetch(`/api/progress?publicationId=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = (await res.json()) as { progress?: ReadingRecord | null };
      if (data.progress) return data.progress;
    }
  } catch {
    /* guest or offline */
  }
  return loadProgress(id);
}

export function rememberRead(entry: {
  id: string;
  title: string;
  chapter?: string;
  nodeId?: string;
  stats?: Record<string, number>;
  facts?: string[];
  path?: PlaySnapshot[];
  explored?: string[];
  memory?: Record<string, PlaySnapshot>;
}) {
  if (!entry.id) return;
  try {
    const prev = readHistory().find((item) => item.id === entry.id);
    const next: ReadingRecord = {
      id: entry.id,
      title: entry.title.trim() || prev?.title || '未命名互动小说',
      chapter: (entry.chapter || prev?.chapter || '').trim(),
      readAt: Date.now(),
      nodeId: entry.nodeId || prev?.nodeId,
      stats: entry.stats || prev?.stats,
      facts: entry.facts || prev?.facts,
      path: entry.path?.filter(isSnapshot) || prev?.path,
      explored: entry.explored || prev?.explored,
      memory: entry.memory || prev?.memory,
    };
    const rest = readHistory().filter((item) => item.id !== next.id);
    localStorage.setItem(KEY, JSON.stringify([next, ...rest].slice(0, MAX)));
    void fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => null);
  } catch {
    /* quota */
  }
}

export function clearProgress(id: string) {
  if (!id) return;
  try {
    const rest = readHistory().filter((item) => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* quota */
  }
}

export function formatReadAt(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
