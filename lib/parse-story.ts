import type { StoryStructure } from './structure';
import {
  emptyChoiceLedger,
  structureChoiceLedger,
  structureEndingLedger,
  structureFactLabels,
  structureStatDefs,
} from './structure';
import type { SceneKind, StoryChoice, StoryData, StoryMeta, StoryNode, StatDef } from './types';

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

function parseFactLabels(raw: unknown): Record<string, string> | undefined {
  const rec = asRecord(raw);
  if (!rec) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
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
    factLabels: parseFactLabels(rec.factLabels),
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

const LEGACY_NODE_ID_RE = /^(p\d+[a-z]*|n\d+[a-z]*|prologue|ending[\w-]*)$/i;
const CHOICE_RE = /^\s*[-*]\s+(.+?)\s*(?:→|->)\s*(.+?)\s*(?:[（(](.+?)[）)])?\s*$/;
const SKIP_HEADER_RE =
  /^(?:[#＃]+\s*)?(?:【)?(?:[一二三四五六七八九十百零\d]+[、.．]\s*)?(状态记录|本场准备|已锁定|目录|人物|共同主线|会变的事|做下的事|选择对照|结局条件|故事地图|分支的形状|持续影响)/;
const PAGE_TURN_RE = /^(下一章|下一页|读下去|继续)$/;

function isLegacyNodeId(id: string): boolean {
  return LEGACY_NODE_ID_RE.test(id);
}

function stripWrap(text: string): string {
  return text.replace(/^[「『“"'《]|[」』”"'》]$/g, '').trim();
}

export function isPageTurnText(text: string): boolean {
  return PAGE_TURN_RE.test(text.trim());
}

function nodeIdByName(story: StoryData, key: string): string | undefined {
  if (story.nodes[key]) return key;
  for (const node of Object.values(story.nodes)) {
    if (node.title === key || node.id === key) return node.id;
  }
  return undefined;
}

/** 选项里的下一跳可能是场面名；正文解析后的节点 id 通常就是这个名字。 */
export function resolveNodeId(story: StoryData, ref: string): string | undefined {
  const key = ref.trim();
  if (!key) return undefined;
  const direct = nodeIdByName(story, key);
  if (direct) return direct;
  const parts = key.split(/[，、,/]/).map((part) => part.trim()).filter((part) => part.length >= 2);
  if (parts.length < 2) return undefined;
  for (const part of [...parts].reverse()) {
    const hit = nodeIdByName(story, part);
    if (hit) return hit;
  }
  return undefined;
}

function parseStatChunk(chunk: string): StatDef | null {
  const t = chunk.trim();
  const withInit = t.match(
    /^(.+?)(?:\s*\(([A-Za-z][\w-]*)\))?\s+(-?\d+)\s+(-?\d+)\s*[–\-]\s*(-?\d+)$/,
  );
  if (withInit) {
    const name = withInit[1].trim();
    return {
      id: (withInit[2] || name).trim(),
      name,
      initial: Number(withInit[3]),
      min: Number(withInit[4]),
      max: Number(withInit[5]),
      visible: true,
    };
  }
  const noInit = t.match(
    /^(.+?)(?:\s*\(([A-Za-z][\w-]*)\))?\s+(-?\d+)\s*[–\-]\s*(-?\d+)$/,
  );
  if (!noInit) return null;
  const name = noInit[1].trim();
  return {
    id: (noInit[2] || name).trim(),
    name,
    initial: 0,
    min: Number(noInit[3]),
    max: Number(noInit[4]),
    visible: true,
  };
}

function parseFactLabelsLine(text: string): Record<string, string> | undefined {
  const line = text.match(/事实[：:]\s*(.+)$/m)?.[1]?.trim();
  if (!line) return undefined;
  const out: Record<string, string> = {};
  for (const chunk of line.split(/[；;、]/)) {
    const m = chunk.trim().match(/^(\S+)\s+(.+)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return Object.keys(out).length ? out : undefined;
}

function parseChangingStats(text: string): StatDef[] {
  const stats: StatDef[] = [];
  const seen = new Set<string>();
  const section = text.split(/会变的事/)[1]?.split(/做下的事|选择对照|故事地图|##\s/)[0] || '';
  const src = section || text;
  for (const line of src.split('\n')) {
    const chunk = line.split(/[｜|]/)[0].trim();
    const parsed = parseStatChunk(chunk);
    if (!parsed || seen.has(parsed.id)) continue;
    seen.add(parsed.id);
    stats.push(parsed);
  }
  return stats;
}

function parseMarkdownMeta(text: string): StoryMeta | null {
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const start = text.match(/起点[：:]\s*(.+)$/m)?.[1]?.trim();
  const statsLine = text.match(/数值[：:]\s*(.+)$/m)?.[1]?.trim();
  const stats: StatDef[] = [];
  if (statsLine) {
    for (const chunk of statsLine.split(/[；;、]/)) {
      const parsed = parseStatChunk(chunk);
      if (parsed) stats.push(parsed);
    }
  }
  if (!stats.length) stats.push(...parseChangingStats(text));
  const logline =
    text.match(/卖点[：:]\s*(.+)$/m)?.[1]?.trim() ||
    text.match(/简介[：:]\s*(.+)$/m)?.[1]?.trim();
  const factLabels = parseFactLabelsLine(text);
  if (!title && !start && stats.length === 0) return null;
  return {
    title: title || '未命名互动小说',
    logline,
    start: start || '',
    stats,
    factLabels,
  };
}

export function parseLedgerText(raw: string | undefined): Pick<StoryChoice, 'effects' | 'setFacts' | 'conditions'> {
  return parseChoiceExtras(raw);
}

function parseChoiceExtras(raw: string | undefined): Pick<StoryChoice, 'effects' | 'setFacts' | 'conditions'> {
  const effects: Record<string, number> = {};
  const setFacts: string[] = [];
  const requireFacts: string[] = [];
  const forbidFacts: string[] = [];
  const requireAnyFacts: string[] = [];
  const minStats: Record<string, number> = {};
  const maxStats: Record<string, number> = {};
  if (!raw) return { effects, setFacts };
  for (const piece of raw.split(/[,，;；]/)) {
    const t = piece.trim();
    if (!t) continue;
    const fact = t.match(/^(?:记下|事实)\s*[:：]?\s*(.+)$/);
    if (fact) {
      setFacts.push(stripWrap(fact[1]));
      continue;
    }
    const needAny = t.match(/^(?:需其一|要其一)\s*[:：]?\s*(.+)$/);
    if (needAny) {
      requireAnyFacts.push(
        ...needAny[1]
          .split(/[|/]/)
          .map((s) => stripWrap(s))
          .filter(Boolean),
      );
      continue;
    }
    const need = t.match(/^(?:需|要)\s*[:：]?\s*(.+)$/);
    if (need) {
      const inner = need[1].trim();
      if (/^没有/.test(inner)) forbidFacts.push(stripWrap(inner.replace(/^没有\s*/, '')));
      else requireFacts.push(stripWrap(inner));
      continue;
    }
    const ban = t.match(/^(?:禁|勿)\s*[:：]?\s*(.+)$/);
    if (ban) {
      forbidFacts.push(stripWrap(ban[1]));
      continue;
    }
    const minStat = t.match(/^(.+?)\s*>=\s*(-?\d+)$/);
    if (minStat) {
      minStats[minStat[1].trim()] = Number(minStat[2]);
      continue;
    }
    const maxStat = t.match(/^(.+?)\s*<=\s*(-?\d+)$/);
    if (maxStat) {
      maxStats[maxStat[1].trim()] = Number(maxStat[2]);
      continue;
    }
    const bareFact = t.match(/^([A-Za-z][\w-]*)$/);
    if (bareFact) {
      setFacts.push(bareFact[1]);
      continue;
    }
    const delta = t.match(/^(.+?)\s*([+-]\d+)$/);
    if (delta) effects[delta[1].trim()] = Number(delta[2]);
  }
  const conditions =
    requireFacts.length ||
    forbidFacts.length ||
    requireAnyFacts.length ||
    Object.keys(minStats).length ||
    Object.keys(maxStats).length
      ? { requireFacts, forbidFacts, requireAnyFacts, minStats, maxStats }
      : undefined;
  return { effects, setFacts, conditions };
}

function firstContentLine(rest: string): string {
  return rest.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).find(Boolean) || '';
}

function hasChoiceOrPageTurn(rest: string): boolean {
  return rest.replace(/\r\n/g, '\n').split('\n').some((line) => CHOICE_RE.test(line));
}

function parseStructure(raw: string): {
  chapter: string;
  kind?: SceneKind;
  isEnding: boolean;
  fromScene?: string;
  mergeAt?: string;
  unmerged?: boolean;
  carries?: string;
} {
  const inner = raw.replace(/^[（(]|[）)]$/g, '').trim();
  const parts = inner.split(/\s*[·•]\s*/).map((s) => s.trim()).filter(Boolean);
  const chapter = parts[0] || inner || '未分章';
  let kind: SceneKind | undefined;
  if (parts.some((p) => p === '结局' || p.startsWith('结局'))) kind = 'ending';
  else if (/分支/.test(inner)) kind = 'branch';
  else if (/汇合点/.test(inner) || parts.some((p) => p === '汇合' || p.startsWith('汇合点'))) kind = 'merge';
  else if (/选择/.test(inner)) kind = 'choice';
  else if (/线性/.test(inner)) kind = 'linear';
  return {
    chapter,
    kind,
    isEnding: kind === 'ending',
    fromScene: inner.match(/从「([^」]+)」分出/)?.[1],
    mergeAt: inner.match(/延迟汇合于「([^」]+)」/)?.[1],
    unmerged: /不汇合/.test(inner),
    carries: inner.match(/带「([^」]+)」/)?.[1],
  };
}

function isSceneChunk(header: string, rest: string): { id: string; title: string } | null {
  const name = header.replace(/\s+/g, ' ').trim();
  if (!name || SKIP_HEADER_RE.test(name)) return null;
  const hm = name.match(/^(\S+)\s*(?:[·•]\s*)?(.*)$/);
  if (!hm) return null;
  const first = hm[1];
  const restTitle = hm[2].trim();
  const structure = firstContentLine(rest);
  const annotated = /^[（(].+[）)]$/.test(structure) && /线性|选择|分支|汇合|结局/.test(structure);
  if (isLegacyNodeId(first)) return { id: first, title: restTitle || first };
  if (annotated || hasChoiceOrPageTurn(rest)) return { id: name, title: name };
  return null;
}

function stripSceneNotes(body: string): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (lines[i]?.trim().startsWith('>')) {
    const block: string[] = [];
    while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim().startsWith('>') || (block.length > 0 && !lines[i].trim()))) {
      if (!lines[i].trim() && block.length > 0 && i + 1 < lines.length && !lines[i + 1].trim().startsWith('>')) break;
      block.push(lines[i]);
      i++;
    }
    if (!/本场准备/.test(block.join('\n'))) i -= block.length;
  }
  const kept: string[] = [];
  while (i < lines.length) {
    if (/^#{2,3}\s*状态记录/.test(lines[i].trim())) break;
    kept.push(lines[i]);
    i++;
  }
  return kept.join('\n').trim();
}

/** 作家写的 Markdown 场面：## 收铺 + （序章 · 线性） + 正文 + - 下一章 → 场面名 */
export function parseMarkdownStory(text: string): StoryData {
  const cleaned = text
    .replace(/===STORY_PATCH===[\s\S]*?(?:===END_STORY_PATCH===|$)/g, '')
    .replace(/===DOC:\w+\+?===/g, '')
    .replace(/===END_DOC===/g, '');
  const story: StoryData = { meta: parseMarkdownMeta(cleaned), nodes: {} };
  const chunks = cleaned.split(/^##\s+/m);
  let firstSceneId = '';
  for (const chunk of chunks.slice(1)) {
    const nl = chunk.indexOf('\n');
    const header = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const rest = nl === -1 ? '' : chunk.slice(nl + 1);
    const scene = isSceneChunk(header, rest);
    if (!scene) continue;
    const { id, title } = scene;
    const lines = rest.replace(/\r\n/g, '\n').split('\n');
    let chapter = '未分章';
    let kind: SceneKind | undefined;
    let markedEnding = false;
    let fromScene: string | undefined;
    let mergeAt: string | undefined;
    let unmerged = false;
    let carries: string | undefined;
    const bodyLines: string[] = [];
    const choices: StoryChoice[] = [];
    for (const line of lines) {
      const chap = line.trim().match(/^[（(].+[）)]$/);
      if (chap && bodyLines.length === 0 && choices.length === 0) {
        const parsed = parseStructure(line.trim());
        chapter = parsed.chapter;
        kind = parsed.kind;
        markedEnding = parsed.isEnding;
        fromScene = parsed.fromScene;
        mergeAt = parsed.mergeAt;
        unmerged = Boolean(parsed.unmerged);
        carries = parsed.carries;
        continue;
      }
      const choice = line.match(CHOICE_RE);
      if (choice) {
        const rawLine = line.trim();
        if (/^[*-]\s*[（(].*[）)]\s*$/.test(rawLine) || /已闭/.test(rawLine)) continue;
        let nextId = choice[2].trim();
        let extraRaw = choice[3];
        const piped = nextId.split(/[｜|]/);
        if (piped.length > 1) {
          nextId = piped[0].trim();
          extraRaw = [piped.slice(1).join('，'), extraRaw].filter(Boolean).join('，');
        }
        const extra = parseChoiceExtras(extraRaw);
        const textLabel = choice[1].trim();
        choices.push({
          id: `${id}-${choices.length + 1}`,
          text: textLabel,
          next: nextId,
          pageTurn: isPageTurnText(textLabel),
          effects: extra.effects,
          setFacts: extra.setFacts,
          unsetFacts: [],
          settleWhen: 'on_choice',
          conditions: extra.conditions,
        });
        continue;
      }
      if (choices.length === 0) bodyLines.push(line);
    }
    const ending = markedEnding || /^ending/i.test(id) || /(结局)$/.test(title);
    const body = stripSceneNotes(bodyLines.join('\n'));
    if (!body && !choices.length) continue;
    if (!firstSceneId) firstSceneId = id;
    story.nodes[id] = {
      id,
      chapter,
      title: title.replace(/[（(]结局[）)]/g, '').trim() || id,
      kind,
      isEnding: ending,
      endingId: ending ? id : null,
      fromScene,
      mergeAt,
      unmerged: unmerged || undefined,
      carries,
      body,
      choices,
    };
  }
  // 纯数字场面名（如「1644」）会被当成数组下标，Object.keys 会把它排到最前。起点按正文出现顺序。
  if (story.meta) {
    if (!story.meta.start || !story.nodes[story.meta.start]) story.meta.start = firstSceneId;
  } else if (firstSceneId) {
    story.meta = { title: '未命名互动小说', start: firstSceneId, stats: parseChangingStats(cleaned) };
  }
  return story;
}

export function applyStructureToStory(story: StoryData, structure?: StoryStructure | null): StoryData {
  if (!structure) return story;
  const stats = structureStatDefs(structure);
  const factLabels = structureFactLabels(structure);
  const incoming = new Set<string>();
  for (const node of structure.flowchart) {
    for (const id of node.next) incoming.add(id);
  }
  const flowStart = structure.flowchart.find((node) => !incoming.has(node.id))?.id || '';
  const nodes: StoryData['nodes'] = {};
  for (const node of Object.values(story.nodes)) {
    nodes[node.id] = {
      ...node,
      choices: node.choices.map((choice) => {
        const extras: string[] = [];
        if (emptyChoiceLedger(choice)) extras.push(structureChoiceLedger(structure, node.id, choice.text, choice.next));
        const nextName = choice.next.trim();
        const leadsToEnding =
          Boolean(structure.flowchart.find((item) => item.id === nextName && item.kind === 'ending')) ||
          Boolean(structure.nodeState.endings.find((item) => item.name === nextName));
        if (leadsToEnding && !choice.conditions) extras.push(structureEndingLedger(structure, nextName));
        const filled = extras.filter(Boolean).join('，');
        if (!filled) return choice;
        const extra = parseChoiceExtras(filled);
        return {
          ...choice,
          effects: Object.keys(choice.effects || {}).length ? choice.effects : extra.effects,
          setFacts: choice.setFacts?.length ? choice.setFacts : extra.setFacts,
          conditions: choice.conditions || extra.conditions,
        };
      }),
    };
  }
  const start =
    (story.meta?.start && nodes[story.meta.start] ? story.meta.start : '') ||
    (flowStart && nodes[flowStart] ? flowStart : '') ||
    story.meta?.start ||
    '';
  return {
    ...story,
    meta: {
      title: story.meta?.title || '未命名互动小说',
      logline: story.meta?.logline,
      start,
      stats: stats.length ? stats : story.meta?.stats || [],
      factLabels: {
        ...factLabels,
        ...(story.meta?.factLabels || {}),
      },
    },
    nodes,
  };
}

/** 正文阅读器只吃小说正文，不要把故事设计文档解析成节点。 */
export function storyFromProse(prose: string, structure?: StoryStructure | null): StoryData {
  const text = prose.trim();
  const story = text ? mergeStory(emptyStory(), text) : emptyStory();
  return applyStructureToStory(story, structure);
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
  const md = parseMarkdownStory(text);
  const mdNodes = Object.values(md.nodes);
  if (md.meta && md.meta.title !== '目录') {
    if (!next.meta) next.meta = md.meta;
    else {
      next.meta = {
        ...next.meta,
        title: md.meta.title && md.meta.title !== '未命名互动小说' ? md.meta.title : next.meta.title,
        logline: md.meta.logline || next.meta.logline,
        start: (md.meta.start && md.nodes[md.meta.start] ? md.meta.start : '') || next.meta.start,
        stats: md.meta.stats.length ? md.meta.stats : next.meta.stats,
        factLabels:
          md.meta.factLabels && Object.keys(md.meta.factLabels).length
            ? md.meta.factLabels
            : next.meta.factLabels,
      };
    }
  }
  for (const node of mdNodes) {
    if (node.body || node.choices.length) next.nodes[node.id] = node;
  }
  const mdFirst =
    (md.meta?.start && md.nodes[md.meta.start] ? md.meta.start : '') ||
    mdNodes.find((node) => !/^\d+$/.test(node.id))?.id ||
    '';
  if (next.meta && (!next.meta.start || !next.nodes[next.meta.start])) {
    next.meta.start = mdFirst && next.nodes[mdFirst] ? mdFirst : '';
  }
  return next;
}

export function countHanChars(text: string): number {
  return Array.from(text).filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}

export function storyWordCount(story: StoryData): number {
  return Object.values(story.nodes).reduce((sum, n) => sum + countHanChars(n.body), 0);
}

const MAP_SKIP_NAMES = new Set([
  '下一章',
  '下一页',
  '读下去',
  '继续',
  '线性',
  '选择',
  '★选择',
  '分支',
  '汇合点',
  '汇合',
  '当场汇合',
  '延迟汇合',
  '不汇合',
  '结局',
  '终局',
  '故事地图',
]);

function addUniqueScene(names: string[], seen: Set<string>, raw: string) {
  const name = stripWrap(raw.replace(/[「」『』《》]/g, '').trim());
  if (!name || name.length < 2 || name.length > 24) return;
  if (MAP_SKIP_NAMES.has(name)) return;
  if (/[【】]/.test(name)) return;
  if (/^(线性|选择|分支|汇合|结局|需[:：])/.test(name)) return;
  if (seen.has(name)) return;
  seen.add(name);
  names.push(name);
}

function stripMapTree(line: string) {
  return line.replace(/^[│┃\s]*[→↓├└┤┬┴┼─\-–—|｜]+/, '').trim();
}

/** 从故事设计里的「故事地图」抽出场面名，顺序尽量保持地图从上到下。 */
export function parseStoryMapScenes(designDoc: string): string[] {
  if (!designDoc.trim()) return [];
  const idx = designDoc.search(/故事地图/);
  if (idx < 0) return [];
  let section = designDoc.slice(idx);
  section = section.split(/^===END_DOC===/m)[0];
  section = section.split(/\n---+\s*\n/)[0];
  const talk = section.search(/\n设计到这里/);
  if (talk >= 0) section = section.slice(0, talk);

  const names: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of section.split('\n')) {
    let line = rawLine.trim();
    if (!line || line === '```' || /^#{1,3}\s/.test(line) || /^【[^】]+】/.test(line)) continue;
    if (/^[↓\s]+$/.test(line)) continue;
    line = stripMapTree(line);
    if (!line) continue;

    const pageTurn = line.match(/^(?:下一章|下一页|读下去)\s*(?:→|->)\s*(.+)$/);
    if (pageTurn) {
      addUniqueScene(names, seen, pageTurn[1].split(/[｜|]/)[0]);
      continue;
    }

    const arrow = line.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
    if (arrow && !/[｜|]/.test(arrow[1])) {
      addUniqueScene(names, seen, arrow[2].split(/[｜|]/)[0]);
      continue;
    }

    addUniqueScene(names, seen, line.split(/[｜|]/)[0]);
  }
  return names;
}

export function writtenSceneNames(story: StoryData): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const node of Object.values(story.nodes)) {
    const name = (node.title || node.id).trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

type ProseChunk = { heading: string; name: string; body: string };

function splitProseChunks(prose: string): { prefix: string; chunks: ProseChunk[] } {
  const parts = prose.replace(/\r\n/g, '\n').split(/^##\s+/m);
  const prefix = parts[0] || '';
  const chunks: ProseChunk[] = [];
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const body = nl === -1 ? '' : part.slice(nl + 1);
    if (!heading) continue;
    const scene = isSceneChunk(heading, body);
    chunks.push({
      heading,
      name: (scene?.title || scene?.id || heading).replace(/\s+/g, ' ').trim(),
      body,
    });
  }
  return { prefix, chunks };
}

/** 正文已经成章，只是没写「下一章 →」。这种场面算写完，下一场按流程图继续。 */
function sceneBodyLanded(body: string): boolean {
  return countHanChars(body) >= 200;
}

function sceneIsFinished(story: StoryData, name: string): boolean {
  const id = resolveNodeId(story, name);
  if (!id) return false;
  const node = story.nodes[id];
  if (node.isEnding || node.kind === 'ending') return true;
  if ((node.choices || []).length > 0) return true;
  return sceneBodyLanded(node.body);
}

/** 最后一场被截断、还没写完：暂停时经常停在这里。成章但没翻页的不算。 */
export function incompleteSceneName(story: StoryData): string | null {
  const nodes = Object.values(story.nodes);
  const last = nodes[nodes.length - 1];
  if (!last) return null;
  if (sceneIsFinished(story, last.title || last.id)) return null;
  return (last.title || last.id).trim() || null;
}

/** 新正文没带上已有的开篇场面，就只是后续章节，必须接在后面，不能整篇替换。 */
export function proseShouldAppend(existing: string, incoming: string): boolean {
  const prev = existing.trim();
  if (!prev) return false;
  const first = prev.match(/^##\s+(\S.*)$/m)?.[1]?.trim();
  if (!first) return true;
  const heads = [...incoming.matchAll(/^##\s+(\S.*)$/gm)].map((match) => match[1].trim());
  if (!heads.length) return false;
  return !heads.includes(first);
}

/** 把新写的场面接到同一份正文上：场面名对得上的，已写完的保留，没写完的覆盖，新的追加。 */
export function mergeProseAppend(
  existing: string,
  incoming: string,
  opts?: { replaceFinished?: boolean },
): string {
  const added = incoming.trim();
  if (!added) return existing;
  const prev = existing.trim();
  if (!prev) return `${added}\n`;

  const have = storyFromProse(prev);
  const { prefix, chunks: oldChunks } = splitProseChunks(prev);
  const { chunks: newChunks } = splitProseChunks(added);
  if (!newChunks.length) return `${prev}\n\n${added}\n`;

  const byName = new Map<string, ProseChunk>();
  const order: string[] = [];
  for (const chunk of oldChunks) {
    if (byName.has(chunk.name)) {
      byName.set(chunk.name, chunk);
      continue;
    }
    byName.set(chunk.name, chunk);
    order.push(chunk.name);
  }
  for (const chunk of newChunks) {
    const exists = byName.has(chunk.name) || Boolean(resolveNodeId(have, chunk.name));
    if (exists && sceneIsFinished(have, chunk.name) && !opts?.replaceFinished) continue;
    if (!byName.has(chunk.name) && !order.includes(chunk.name)) order.push(chunk.name);
    byName.set(chunk.name, chunk);
  }

  const body = order
    .map((name) => {
      const chunk = byName.get(name);
      if (!chunk) return '';
      return `## ${chunk.heading}\n${chunk.body}`.trim();
    })
    .filter(Boolean)
    .join('\n\n');
  const head = prefix.trim();
  return `${head ? `${head}\n\n` : ''}${body}\n`;
}

export function lastSceneTail(story: StoryData, max = 900): string {
  const nodes = Object.values(story.nodes);
  const last = nodes[nodes.length - 1];
  if (!last) return '';
  const text = `${last.title}\n${last.body}`.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n……（已截）`;
}

export function danglingNexts(story: StoryData): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const node of Object.values(story.nodes)) {
    for (const choice of node.choices || []) {
      const next = (choice.next || '').trim();
      if (!next || isPageTurnText(next) || resolveNodeId(story, next) || seen.has(next)) continue;
      seen.add(next);
      missing.push(next);
    }
  }
  return missing;
}

/** 故事地图上还没写成正文的场面，加上正文里已经点出来但还没落地的下一跳。 */
export function missingScenes(designDoc: string, story: StoryData, mapNames?: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (name: string) => {
    const n = name.trim();
    if (!n || seen.has(n)) return;
    const id = resolveNodeId(story, n);
    if (id && sceneIsFinished(story, n)) return;
    seen.add(n);
    out.push(n);
  };
  const incomplete = incompleteSceneName(story);
  if (incomplete) add(incomplete);
  const names = mapNames && mapNames.length ? mapNames : parseStoryMapScenes(designDoc);
  for (const name of names) add(name);
  for (const name of danglingNexts(story)) add(name);
  return out;
}

export function bookHasEnding(story: StoryData): boolean {
  return Object.values(story.nodes).some((node) => node.isEnding || node.kind === 'ending');
}

export function isBookComplete(
  designDoc: string,
  story: StoryData,
  styleLocked: boolean,
  mapNames?: string[],
): boolean {
  if (!styleLocked) return false;
  if (Object.keys(story.nodes).length === 0) return false;
  const names = mapNames && mapNames.length ? mapNames : parseStoryMapScenes(designDoc);
  if (missingScenes(designDoc, story, names).length > 0) return false;
  if (names.length > 0) return true;
  return bookHasEnding(story);
}

export function renderBody(
  body: string,
  facts: Set<string>,
  stats: Record<string, number>,
  opts?: { revealBranches?: boolean },
): string {
  let text = body.replace(
    /\{\{if:([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{endif\}\}/g,
    (_, fact, yes, no) => {
      const key = String(fact).trim();
      if (opts?.revealBranches) {
        const a = String(yes ?? '').trim();
        const b = String(no ?? '').trim();
        if (a && b) return `【若已${key}】${a}\n\n【若未${key}】${b}`;
        if (a) return `【若已${key}】${a}`;
        return b;
      }
      return facts.has(key) ? yes : no ?? '';
    },
  );
  text = text.replace(/\{\{stat:([^}]+)\}\}/g, (_, id) => String(stats[String(id).trim()] ?? 0));
  return text;
}

export function resolveStatDef(statDefs: StatDef[], key: string): StatDef | undefined {
  return statDefs.find((s) => s.id === key || s.name === key);
}

export function choiceAvailable(
  choice: StoryChoice,
  stats: Record<string, number>,
  facts: Set<string>,
  statDefs: StatDef[] = [],
): boolean {
  const c = choice.conditions;
  if (!c) return true;
  if (c.requireFacts?.some((f) => !facts.has(f))) return false;
  if (c.forbidFacts?.some((f) => facts.has(f))) return false;
  if (c.requireAnyFacts?.length && c.requireAnyFacts.every((f) => !facts.has(f))) return false;
  if (c.minStats) {
    for (const [k, v] of Object.entries(c.minStats)) {
      const def = resolveStatDef(statDefs, k);
      const value = stats[def?.id ?? k] ?? def?.initial ?? 0;
      if (value < v) return false;
    }
  }
  if (c.maxStats) {
    for (const [k, v] of Object.entries(c.maxStats)) {
      const def = resolveStatDef(statDefs, k);
      const value = stats[def?.id ?? k] ?? def?.initial ?? 0;
      if (value > v) return false;
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
    const def = resolveStatDef(statDefs, k);
    const key = def?.id ?? k;
    const raw = (nextStats[key] ?? def?.initial ?? 0) + delta;
    nextStats[key] = def ? Math.min(def.max, Math.max(def.min, raw)) : raw;
  }
  const nextFacts = new Set(facts);
  for (const f of choice.setFacts ?? []) nextFacts.add(f);
  for (const f of choice.unsetFacts ?? []) nextFacts.delete(f);
  return { stats: nextStats, facts: nextFacts };
}

export function factLabel(id: string, meta: StoryMeta | null | undefined): string {
  return meta?.factLabels?.[id] || id;
}

export function initialStats(meta: StoryMeta | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of meta?.stats ?? []) out[s.id] = s.initial;
  return out;
}

export type FlowConnector = 'root' | 'next' | 'branch' | 'branch-last' | 'merge';

export type FlowRow =
  | { type: 'chapter'; chapter: string }
  | { type: 'arrow'; depth: number }
  | {
      type: 'node';
      id: string;
      depth: number;
      connector: FlowConnector;
      sceneKind: SceneKind;
      spine: boolean;
    };

export function chapterLabel(chapter: string): string {
  const m = chapter.match(/^(序章|终章|终局|结局|第[一二三四五六七八九十百零\d]+章|[一二三四五六七八九十百零\d]+章)/);
  return m ? m[1] : chapter;
}

export function nodeNextIds(node: StoryNode | undefined, visible: Set<string>): string[] {
  const ids: string[] = [];
  for (const choice of node?.choices ?? []) {
    if (!choice.next || !visible.has(choice.next) || ids.includes(choice.next)) continue;
    ids.push(choice.next);
  }
  return ids;
}

function incomingCount(story: StoryData, visible: Set<string>): Map<string, number> {
  const deg = new Map<string, number>();
  for (const id of visible) deg.set(id, 0);
  for (const id of visible) {
    for (const next of nodeNextIds(story.nodes[id], visible)) {
      deg.set(next, (deg.get(next) || 0) + 1);
    }
  }
  return deg;
}

export function inferSceneKind(node: StoryNode, inDegree = 0): SceneKind {
  const real = (node.choices || []).filter((c) => !c.pageTurn && !isPageTurnText(c.text));
  if (node.isEnding || node.kind === 'ending') return 'ending';
  if (real.length >= 2 || node.kind === 'choice') return 'choice';
  if (node.kind) return node.kind;
  if (inDegree >= 2) return 'merge';
  return 'linear';
}

function isMergeNode(node: StoryNode | undefined, inDegree: number): boolean {
  if (!node) return false;
  if (node.kind === 'merge') return true;
  return inDegree >= 2 && node.kind !== 'choice' && node.kind !== 'branch';
}

function followMerge(
  start: string,
  story: StoryData,
  visible: Set<string>,
  deg: Map<string, number>,
): string | null {
  const startNode = story.nodes[start];
  if (startNode?.mergeAt && visible.has(startNode.mergeAt) && startNode.mergeAt !== start) {
    return startNode.mergeAt;
  }
  let cur = start;
  const seen = new Set<string>();
  while (cur && visible.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    const node = story.nodes[cur];
    if (!node) return null;
    if (node.mergeAt && visible.has(node.mergeAt) && node.mergeAt !== start) return node.mergeAt;
    if (node.unmerged) return null;
    const nexts = nodeNextIds(node, visible);
    if (nexts.length === 0) return null;
    if (nexts.length > 1) {
      const nested = commonMerge(nexts, story, visible, deg);
      return nested;
    }
    const n = nexts[0];
    if (n !== start && isMergeNode(story.nodes[n], deg.get(n) || 0)) return n;
    cur = n;
  }
  return null;
}

function commonMerge(
  branchStarts: string[],
  story: StoryData,
  visible: Set<string>,
  deg: Map<string, number>,
): string | null {
  if (branchStarts.length < 2) return null;
  const fromAnno = branchStarts
    .map((id) => story.nodes[id]?.mergeAt)
    .filter((id): id is string => Boolean(id && visible.has(id)));
  if (fromAnno.length >= 2 && fromAnno.every((id) => id === fromAnno[0])) return fromAnno[0];
  const targets = branchStarts.map((id) => followMerge(id, story, visible, deg));
  if (targets.length >= 2 && targets.every((id) => id && id === targets[0])) return targets[0];
  return null;
}

/** 按故事地图的分岔 / 汇合画出流程图，而不是章节目录。 */
export function buildStoryFlow(
  story: StoryData,
  visibleIds: string[],
  spineIds: string[] = [],
): FlowRow[] {
  const visible = new Set(visibleIds.filter((id) => story.nodes[id]));
  const spine = new Set(spineIds);
  const deg = incomingCount(story, visible);
  const rows: FlowRow[] = [];
  const placed = new Set<string>();
  let lastChapter = '';

  function emitChapter(node: StoryNode, depth: number) {
    if (depth > 0) return;
    const chap = chapterLabel(node.chapter);
    if (!chap || chap === lastChapter) return;
    lastChapter = chap;
    rows.push({ type: 'chapter', chapter: chap });
  }

  function walk(id: string, depth: number, connector: FlowConnector, stopAt: string | null, inFork: boolean) {
    if (!id || !visible.has(id) || placed.has(id) || id === stopAt) return;
    const node = story.nodes[id];
    if (!node) return;
    emitChapter(node, inFork ? 1 : depth);
    placed.add(id);
    const inDeg = deg.get(id) || 0;
    rows.push({
      type: 'node',
      id,
      depth,
      connector,
      sceneKind: inferSceneKind(node, inDeg),
      spine: spine.has(id),
    });
    const nexts = nodeNextIds(node, visible);
    if (nexts.length === 0) return;
    if (nexts.length === 1) {
      const next = nexts[0];
      if (next === stopAt) return;
      const nextNode = story.nodes[next];
      const sameChap = nextNode && chapterLabel(nextNode.chapter) === chapterLabel(node.chapter);
      const mergeLike =
        (deg.get(next) || 0) >= 2 ||
        (nextNode?.kind === 'merge' && inFork && (node.kind === 'branch' || connector === 'branch' || connector === 'branch-last' || connector === 'next'));
      if (inFork && mergeLike) {
        rows.push({ type: 'arrow', depth });
        walk(next, depth, 'merge', stopAt, false);
        return;
      }
      if (!inFork && !sameChap) {
        walk(next, 0, 'root', stopAt, false);
        return;
      }
      const nextDepth =
        inFork && (connector === 'branch' || connector === 'branch-last')
          ? depth + 1
          : !inFork && connector === 'root'
            ? Math.max(depth, 1)
            : depth;
      walk(next, nextDepth, 'next', stopAt, inFork);
      return;
    }
    const merge = commonMerge(nexts, story, visible, deg);
    nexts.forEach((nid, i) => {
      const last = i === nexts.length - 1;
      walk(nid, depth + 1, last ? 'branch-last' : 'branch', merge, true);
    });
    if (merge && visible.has(merge) && !placed.has(merge) && merge !== stopAt) {
      rows.push({ type: 'arrow', depth: depth + 1 });
      walk(merge, depth + 1, 'merge', stopAt, false);
    }
  }

  const start = (story.meta?.start && visible.has(story.meta.start) ? story.meta.start : visibleIds.find((id) => visible.has(id))) || '';
  if (start) walk(start, 0, 'root', null, false);

  const leftover = [...visible].filter((id) => !placed.has(id));
  if (leftover.length) {
    const roots = leftover.filter((id) => (deg.get(id) || 0) === 0);
    const queue = roots.length ? roots : leftover;
    lastChapter = '';
    rows.push({ type: 'chapter', chapter: '未接上' });
    for (const id of queue) {
      if (!placed.has(id)) walk(id, 0, 'root', null, false);
    }
    for (const id of leftover) {
      if (placed.has(id)) continue;
      const node = story.nodes[id];
      if (!node) continue;
      emitChapter(node, 0);
      placed.add(id);
      rows.push({
        type: 'node',
        id,
        depth: 0,
        connector: 'root',
        sceneKind: inferSceneKind(node, deg.get(id) || 0),
        spine: spine.has(id),
      });
    }
  }
  return rows;
}

export function flowGutter(row: FlowRow): string {
  if (row.type === 'chapter') return '';
  if (row.type === 'arrow') return `${'  '.repeat(row.depth)}↓`;
  const pad = '  '.repeat(row.depth);
  if (row.connector === 'next') return `${pad}→ `;
  if (row.connector === 'branch') return `${pad}├─ `;
  if (row.connector === 'branch-last') return `${pad}└─ `;
  if (row.connector === 'merge') return `${pad}`;
  return pad;
}

export function flowKindMark(kind: SceneKind): string {
  if (kind === 'choice') return '★';
  if (kind === 'merge') return '汇';
  if (kind === 'ending') return '结';
  return '';
}
