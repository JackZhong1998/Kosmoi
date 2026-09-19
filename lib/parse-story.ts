import type { StoryChoice, StoryData, StoryMeta, StoryNode, StatDef } from './types';

const PATCH_RE = /===STORY_PATCH===([\s\S]*?)===END_STORY_PATCH===/g;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function asNumMap(v: unknown): Record<string, number> {
  const rec = asRecord(v);
  if (!rec) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(rec)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
  }
  return out;
}

function parseStat(raw: unknown): StatDef | null {
  const rec = asRecord(raw);
  if (!rec || typeof rec.id !== 'string') return null;
  return {
    id: rec.id,
    name: asString(rec.name, rec.id),
    initial: asNumber(rec.initial, 0),
    min: asNumber(rec.min, 0),
    max: asNumber(rec.max, 10),
    visible: rec.visible !== false,
  };
}

function parseChoice(raw: unknown, index: number): StoryChoice | null {
  const rec = asRecord(raw);
  if (!rec || typeof rec.next !== 'string' || typeof rec.text !== 'string') return null;
  const cond = asRecord(rec.conditions);
  return {
    id: asString(rec.id, `c${index}`),
    text: rec.text,
    meaning: asString(rec.meaning) || undefined,
    next: rec.next,
    effects: asNumMap(rec.effects),
    setFacts: asStringArray(rec.setFacts),
    unsetFacts: asStringArray(rec.unsetFacts),
    settleWhen: rec.settleWhen === 'on_result' ? 'on_result' : 'on_choice',
    conditions: cond
      ? {
          requireFacts: asStringArray(cond.requireFacts),
          forbidFacts: asStringArray(cond.forbidFacts),
          minStats: asNumMap(cond.minStats),
          maxStats: asNumMap(cond.maxStats),
        }
      : undefined,
  };
}

function parseNode(raw: unknown): StoryNode | null {
  const rec = asRecord(raw);
  if (!rec || typeof rec.id !== 'string' || typeof rec.body !== 'string') return null;
  const choices = Array.isArray(rec.choices)
    ? rec.choices.map(parseChoice).filter((x): x is StoryChoice => Boolean(x))
    : [];
  return {
    id: rec.id,
    chapter: asString(rec.chapter, '未分章'),
    title: asString(rec.title, rec.id),
    isEnding: Boolean(rec.isEnding),
    endingId: typeof rec.endingId === 'string' ? rec.endingId : null,
    body: rec.body,
    choices,
  };
}

function parseMeta(raw: unknown): StoryMeta | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const stats = Array.isArray(rec.stats)
    ? rec.stats.map(parseStat).filter((x): x is StatDef => Boolean(x))
    : [];
  const start = asString(rec.start);
  const title = asString(rec.title, '未命名互动小说');
  if (!start && stats.length === 0 && !asString(rec.title)) return null;
  return {
    title,
    logline: asString(rec.logline) || undefined,
    start: start || 'n01',
    stats,
  };
}

function extractJsonObjects(text: string): unknown[] {
  const objects: unknown[] = [];
  for (const match of text.matchAll(PATCH_RE)) {
    const chunk = match[1].trim();
    try {
      objects.push(JSON.parse(chunk));
    } catch {
      const repaired = chunk.replace(/,\s*([}\]])/g, '$1');
      try {
        objects.push(JSON.parse(repaired));
      } catch {
        /* skip broken patch */
      }
    }
  }
  return objects;
}

export function emptyStory(): StoryData {
  return { meta: null, nodes: {} };
}

export function mergeStory(base: StoryData, text: string): StoryData {
  const next: StoryData = {
    meta: base.meta ? { ...base.meta, stats: [...base.meta.stats] } : null,
    nodes: { ...base.nodes },
  };
  for (const obj of extractJsonObjects(text)) {
    const rec = asRecord(obj);
    if (!rec) continue;
    const meta = parseMeta(rec.meta);
    if (meta) next.meta = meta;
    const nodes = Array.isArray(rec.nodes) ? rec.nodes : [];
    for (const n of nodes) {
      const node = parseNode(n);
      if (node) next.nodes[node.id] = node;
    }
  }
  return next;
}

export function countHanChars(text: string): number {
  return Array.from(text).filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}

export function storyWordCount(story: StoryData): number {
  return Object.values(story.nodes).reduce((sum, n) => sum + countHanChars(n.body), 0);
}

export function renderBody(body: string, facts: Set<string>, stats: Record<string, number>): string {
  let text = body.replace(/\{\{if:([a-zA-Z0-9_\-]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{endif\}\}/g, (_, fact, yes, no) =>
    facts.has(fact) ? yes : no ?? '',
  );
  text = text.replace(/\{\{stat:([a-zA-Z0-9_\-]+)\}\}/g, (_, id) => String(stats[id] ?? 0));
  return text;
}

export function choiceAvailable(
  choice: StoryChoice,
  stats: Record<string, number>,
  facts: Set<string>,
): boolean {
  const c = choice.conditions;
  if (!c) return true;
  if (c.requireFacts?.some((f) => !facts.has(f))) return false;
  if (c.forbidFacts?.some((f) => facts.has(f))) return false;
  if (c.minStats) {
    for (const [k, v] of Object.entries(c.minStats)) {
      if ((stats[k] ?? 0) < v) return false;
    }
  }
  if (c.maxStats) {
    for (const [k, v] of Object.entries(c.maxStats)) {
      if ((stats[k] ?? 0) > v) return false;
    }
  }
  return true;
}

export function applyChoice(
  choice: StoryChoice,
  stats: Record<string, number>,
  facts: Set<string>,
  statDefs: StatDef[],
): { stats: Record<string, number>; facts: Set<string> } {
  const nextStats = { ...stats };
  for (const [k, delta] of Object.entries(choice.effects ?? {})) {
    const def = statDefs.find((s) => s.id === k);
    const raw = (nextStats[k] ?? 0) + delta;
    nextStats[k] = def ? Math.min(def.max, Math.max(def.min, raw)) : raw;
  }
  const nextFacts = new Set(facts);
  for (const f of choice.setFacts ?? []) nextFacts.add(f);
  for (const f of choice.unsetFacts ?? []) nextFacts.delete(f);
  return { stats: nextStats, facts: nextFacts };
}

export function initialStats(meta: StoryMeta | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of meta?.stats ?? []) out[s.id] = s.initial;
  return out;
}
