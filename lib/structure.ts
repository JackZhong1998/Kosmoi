import type { ChatMessage, StatDef, StoryChoice } from './types';

export const STRUCTURE_OPEN = '===STRUCTURE===';
export const STRUCTURE_CLOSE = '===END_STRUCTURE===';

export type FlowKind = 'linear' | 'choice' | 'branch' | 'merge' | 'ending';
export type FlowJoin = '' | '当场汇合' | '延迟汇合' | '不汇合';

export type FlowNode = {
  id: string;
  chapter: string;
  kind: FlowKind;
  summary: string;
  who: string;
  from: string;
  enter: string;
  meaning: string;
  stateChange: string;
  carries: string;
  join: FlowJoin;
  mergeAt: string;
  echo: string;
  ending: string;
  next: string[];
};

export type FlowTree =
  | { type: 'node'; node: FlowNode; next: FlowTree | null }
  | { type: 'fork'; node: FlowNode; arms: FlowTree[]; join: FlowTree | null };

export type StructureOption = { text: string; meaning: string };

export type StructureNode = {
  id: string;
  chapter: string;
  whenWhereWho: string;
  enter: string;
  purpose: string;
  desire: string;
  must: string;
  options: StructureOption[];
  feedback: string;
  stateChange: string;
  settleWhen: string;
  affects: string;
  next: string;
  plant: string;
  words: string;
};

export type StructureStat = {
  name: string;
  means: string;
  initial: number;
  min: number;
  max: number;
  step: string;
  visible: boolean;
  affects: string;
};

export type StructureFact = {
  key: string;
  means: string;
  use: string;
  mutex: string;
};

export type StructureChoice = {
  node: string;
  option: string;
  stats: string;
  facts: string;
  settleWhen: string;
  feedback: string;
  later: string;
};

export type StructureEnding = {
  name: string;
  stats: string;
  events: string;
  forbid: string;
  finalChoice: string;
  trigger: string;
  priority: string;
};

export type StructureSimulation = {
  route: string;
  choices: string;
  stats: string;
  facts: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export type StoryStructure = {
  flowchart: FlowNode[];
  nodeState: {
    nodes: StructureNode[];
    play: string;
    stats: StructureStat[];
    facts: StructureFact[];
    choices: StructureChoice[];
    endings: StructureEnding[];
    simulations: StructureSimulation[];
  };
};

const KINDS = new Set<FlowKind>(['linear', 'choice', 'branch', 'merge', 'ending']);
const JOINS = new Set<FlowJoin>(['', '当场汇合', '延迟汇合', '不汇合']);

export function isStructureMessage(message: ChatMessage) {
  return message.role === 'assistant' && message.content.includes(STRUCTURE_OPEN);
}

export function stripStructureMessages(messages: ChatMessage[]) {
  return messages.filter((message) => !isStructureMessage(message));
}

export function structureBlock(jsonText: string) {
  return `${STRUCTURE_OPEN}\n${jsonText.trim()}\n${STRUCTURE_CLOSE}`;
}

export function withLatestStructure(messages: ChatMessage[], jsonText: string): ChatMessage[] {
  return [...stripStructureMessages(messages), { role: 'assistant', content: structureBlock(jsonText) }];
}

/** 写正文时把已解析的结构附进模型上下文，不写回对话记录。 */
export function withStructureContext(messages: ChatMessage[], jsonText: string): ChatMessage[] {
  const clean = stripStructureMessages(messages);
  const json = jsonText.trim();
  const parsed = parseStructure(json);
  if (!json || !parsed) return clean;
  const lines = structureChoicePrompt(parsed);
  const note: ChatMessage = {
    role: 'user',
    content: `【结构对照，不要回复这一段，也不要复述】最新的节点表、状态表和故事流程图：\n${json}${
      lines
        ? `\n\n选项行必须照抄节点名和加减，不要另起数值名：\n${lines}`
        : ''
    }`,
  };
  const last = clean[clean.length - 1];
  if (last?.role === 'user') return [...clean.slice(0, -1), note, last];
  return [...clean, note];
}

export function latestStructureRaw(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!isStructureMessage(messages[i])) continue;
    const body = messages[i].content.split(STRUCTURE_OPEN)[1]?.split(STRUCTURE_CLOSE)[0] || '';
    const text = body.trim();
    if (text) return text;
  }
  return '';
}

export type StructurePart = 'flowchart' | 'nodes' | 'states';

function clipText(text: string, n: number) {
  const t = (text || '').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}\n\n……（已截）`;
}

function revisionNote(revision: string) {
  return revision.trim() || '无。按当前故事设计和上面的讨论，全新编写。';
}

export function structureTaskMessage(designDoc: string, revision: string): ChatMessage {
  return structurePartTask({ part: 'flowchart', designDoc, revision });
}

export function structurePartTask(opts: {
  part: StructurePart;
  designDoc: string;
  revision?: string;
  flowIds?: string[];
  missingIds?: string[];
}): ChatMessage {
  const design = opts.designDoc.trim();
  const note = revisionNote(opts.revision || '');
  if (opts.part === 'flowchart') {
    return {
      role: 'user',
      content: `只输出故事流程图 JSON。格式必须是：
{"flowchart":[{"id":"节点中文名","chapter":"序章","kind":"linear","summary":"一句话","next":["下一节点"],"from":"","enter":"","meaning":"","stateChange":"","join":"","mergeAt":"","echo":"","ending":"","who":""}]}

硬性要求：
- 第一个字符是 {，最后一个字符是 }
- 字段名只用英文 flowchart，不要写 nodes、states，不要 Markdown，不要解释
- 至少 8 个节点；每个 id 是中文场面名；用 next 连起来
- 字符串里不要换行

--- 故事设计 ---
${clipText(design, 7000)}

选择点、汇合和不汇合的大分支，以设计里的「分支设计」为准，不要另起一套。

--- 编辑最新修改意见 ---
${note}`,
    };
  }
  const ids = (opts.missingIds?.length ? opts.missingIds : opts.flowIds || []).filter(Boolean);
  if (opts.part === 'nodes') {
    return {
      role: 'user',
      content: `流程图节点已经定死，不要改名、不要增删。只输出 {"nodes":[...]}。id 必须和这份清单一字不差，只写这些节点。每个字符串不超过 40 个字。不要写 flowchart，不要写 states。第一个字符是 {，不要解释。

节点清单：
${ids.join('、') || '（空）'}

--- 故事设计（节选）---
${clipText(design, 2200)}`,
    };
  }
  return {
    role: 'user',
    content: `只输出 {"states":{...}}。数值名字、起点、结局门槛必须沿用设计里的「数值系统设计」，不要另起一套。必须有 play、stats、facts、choices、endings、simulations。不要写 flowchart，不要写 nodes。第一个字符是 {，不要解释。

选择与结局节点：
${(opts.flowIds || []).join('、')}

--- 数值系统设计与结局 ---
${clipText(design, 4500)}`,
  };
}

export function extractJsonField(raw: string, key: string): unknown {
  const aliases =
    key === 'flowchart'
      ? ['flowchart', 'flow', '流程图', '故事流程图']
      : key === 'nodes'
        ? ['nodes', '节点表', '节点']
        : key === 'states'
          ? ['states', '状态表', 'state']
          : [key];
  const obj = parseJsonObject(raw);
  if (obj) {
    for (const name of aliases) {
      if (Object.prototype.hasOwnProperty.call(obj, name)) return obj[name];
    }
    // 模型有时直接回数组，包在无名对象里
    if (key === 'flowchart' && Array.isArray(obj.flowchart)) return obj.flowchart;
  }
  for (const name of aliases) {
    const matched = new RegExp(`"${name}"\\s*:\\s*([\\[{])`).exec(raw);
    if (!matched) continue;
    const start = raw.indexOf(matched[1], matched.index);
    if (start < 0) continue;
    const candidate = closeTruncatedJson(raw.slice(start));
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      /* try next alias */
    }
  }
  // 整段就是数组
  const trimmed = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(closeTruncatedJson(trimmed).replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function flowIdsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === 'string') {
      const id = item.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = asText(row.id || row.name || row['场面名'] || row['节点']);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function serializeStructure(data: StoryStructure): string {
  return JSON.stringify({
    flowchart: data.flowchart,
    nodes: data.nodeState.nodes,
    states: {
      play: data.nodeState.play,
      stats: data.nodeState.stats,
      facts: data.nodeState.facts,
      choices: data.nodeState.choices,
      endings: data.nodeState.endings,
      simulations: data.nodeState.simulations,
    },
  });
}

export function mergeStructureParts(parts: { flowchart?: unknown; nodes?: unknown; states?: unknown }): string {
  return JSON.stringify({
    flowchart: Array.isArray(parts.flowchart) ? parts.flowchart : [],
    nodes: Array.isArray(parts.nodes) ? parts.nodes : [],
    states: parts.states && typeof parts.states === 'object' ? parts.states : {},
  });
}

export function structureParseError(raw: string) {
  const text = raw.trim();
  if (!text) return '结构没整理出来，可以再试一次。';
  if (!text.includes('{')) return '节点和流程图没有按 JSON 返回（回的是说明，不是 JSON）';
  if (!text.trimEnd().endsWith('}') && !text.includes('===END')) {
    return '节点和流程图没有按 JSON 返回（JSON 没写完）';
  }
  return '节点和流程图没有按 JSON 返回（JSON 格式坏了）';
}

function closeTruncatedJson(input: string) {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '{' || ch === '[') stack.push(ch);
    else if ((ch === '}' || ch === ']') && stack.length) stack.pop();
  }
  let out = input;
  if (inStr) out += '"';
  out = out.replace(/,\s*"[^"\n]*$/, '');
  out = out.replace(/,\s*$/, '');
  while (stack.length) {
    const open = stack.pop();
    out += open === '{' ? '}' : ']';
  }
  return out.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const starts: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') starts.push(i);
  }
  const preferred = starts.filter((index) => /flowchart|nodeState|流程图|节点/.test(cleaned.slice(index, index + 240)));
  const order = preferred.length ? [...preferred].reverse().concat(starts[0] ?? []) : starts.slice(0, 1);
  const seen = new Set<number>();
  for (const index of order) {
    if (seen.has(index)) continue;
    seen.add(index);
    const slice = cleaned.slice(index);
    const end = slice.lastIndexOf('}');
    const candidates = [end > 0 ? slice.slice(0, end + 1) : '', closeTruncatedJson(slice)];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const data = JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
        if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
      } catch {
        /* try the next candidate */
      }
    }
  }
  return null;
}

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asNum(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(asText(value));
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown) {
  if (typeof value === 'boolean') return value;
  const text = asText(value);
  if (/^(true|是|通过|yes)$/i.test(text)) return true;
  if (/^(false|否|未通过|no)$/i.test(text)) return false;
  return false;
}

function asStringList(value: unknown) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  const text = asText(value);
  if (!text) return [];
  return text
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asKind(value: unknown): FlowKind {
  const text = asText(value);
  if (KINDS.has(text as FlowKind)) return text as FlowKind;
  if (/结局/.test(text)) return 'ending';
  if (/汇合/.test(text)) return 'merge';
  if (/选择|分岔/.test(text)) return 'choice';
  if (/分支/.test(text)) return 'branch';
  return 'linear';
}

function asJoin(value: unknown): FlowJoin {
  const text = asText(value);
  if (JOINS.has(text as FlowJoin)) return text as FlowJoin;
  if (/不汇合/.test(text)) return '不汇合';
  if (/延迟/.test(text)) return '延迟汇合';
  if (/当场|立即/.test(text)) return '当场汇合';
  return '';
}

function asOptions(value: unknown): StructureOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const text = asText(row.text || row.option || row['选项']);
      if (!text) return null;
      return { text, meaning: asText(row.meaning || row['含义']) };
    })
    .filter((item): item is StructureOption => Boolean(item));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function nestedObject(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function nodeFromRow(id: string, row: Record<string, unknown>): StructureNode {
  return {
    id,
    chapter: asText(row.chapter) || '正文',
    whenWhereWho: asText(row.whenWhereWho),
    enter: asText(row.enter),
    purpose: asText(row.purpose),
    desire: asText(row.desire),
    must: asText(row.must),
    options: asOptions(row.options),
    feedback: asText(row.feedback),
    stateChange: asText(row.stateChange),
    settleWhen: asText(row.settleWhen),
    affects: asText(row.affects),
    next: Array.isArray(row.next) ? asStringList(row.next).join('、') : asText(row.next),
    plant: asText(row.plant),
    words: asText(row.words),
  };
}

export function parseStructure(raw: string): StoryStructure | null {
  const data = parseJsonObject(raw);
  if (!data) return null;
  const nodeStateRaw = nestedObject(data, ['nodeState', 'node_state', '节点状态', '节点与状态']) || data;
  const flowRaw = asArray(data.flowchart || data.flow || data['流程图'] || data['故事流程图'] || nodeStateRaw.flowchart);
  const nodesRaw = asArray(
    nodeStateRaw.nodes || nodeStateRaw['节点表'] || data.nodes || data['节点表'],
  );
  if (!flowRaw.length && !nodesRaw.length) return null;

  const flowchart: FlowNode[] = [];
  const seen = new Set<string>();
  for (const item of flowRaw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = asText(row.id || row.name || row['场面名'] || row['节点']);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const stateChange = asText(row.stateChange || row['状态变化'] || row.carries || row['携带']);
    flowchart.push({
      id,
      chapter: asText(row.chapter || row['章节']) || '正文',
      kind: asKind(row.kind || row['类型']),
      summary: asText(row.summary || row['发生什么'] || row['摘要']),
      who: asText(row.who || row['在场']),
      from: asText(row.from || row['从']),
      enter: asText(row.enter || row['进入条件']),
      meaning: asText(row.meaning || row['含义']),
      stateChange,
      carries: asText(row.carries || row['携带']) || stateChange,
      join: asJoin(row.join || row['汇合']),
      mergeAt: asText(row.mergeAt || row['汇合于'] || row['汇合位置']),
      echo: asText(row.echo || row['再次体现']),
      ending: asText(row.ending || row['结局']),
      next: asStringList(row.next || row['下一节点']),
    });
  }
  if (!flowchart.length) {
    for (const item of nodesRaw) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const id = asText(row.id || row['节点'] || row['场面名']);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      flowchart.push({
        id,
        chapter: asText(row.chapter) || '正文',
        kind: row.options && asOptions(row.options).length ? 'choice' : 'linear',
        summary: asText(row.purpose || row.summary),
        who: asText(row.whenWhereWho),
        from: '',
        enter: '',
        meaning: '',
        stateChange: '',
        carries: '',
        join: '',
        mergeAt: '',
        echo: '',
        ending: '',
        next: asStringList(row.next),
      });
    }
  }
  if (!flowchart.length) return null;

  const nodes: StructureNode[] = nodesRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = asText(row.id || row['节点'] || row['场面名'] || row.name);
      if (!id) return null;
      return nodeFromRow(id, row);
    })
    .filter((item): item is StructureNode => Boolean(item));
  if (!nodes.length) {
    for (const flow of flowchart) nodes.push(nodeFromRow(flow.id, { chapter: flow.chapter, purpose: flow.summary, next: flow.next.join('、') }));
  }

  const statesRaw =
    nestedObject(nodeStateRaw, ['states', '状态表', 'state']) ||
    nestedObject(data, ['states', '状态表']) ||
    nodeStateRaw;

  const stats = (Array.isArray(statesRaw.stats) ? statesRaw.stats : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = asText(row.name);
      if (!name) return null;
      return {
        name,
        means: asText(row.means),
        initial: asNum(row.initial),
        min: asNum(row.min),
        max: asNum(row.max, 10),
        step: asText(row.step),
        visible: asBool(row.visible),
        affects: asText(row.affects),
      };
    })
    .filter((item): item is StructureStat => Boolean(item));

  const facts = (Array.isArray(statesRaw.facts) ? statesRaw.facts : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const key = asText(row.key || row.name);
      if (!key) return null;
      return { key, means: asText(row.means), use: asText(row.use) || '记忆事实', mutex: asText(row.mutex) };
    })
    .filter((item): item is StructureFact => Boolean(item));

  const choices = (Array.isArray(statesRaw.choices) ? statesRaw.choices : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const node = asText(row.node);
      const option = asText(row.option);
      if (!node || !option) return null;
      return {
        node,
        option,
        stats: asText(row.stats) || '无',
        facts: asText(row.facts) || '无',
        settleWhen: asText(row.settleWhen),
        feedback: asText(row.feedback),
        later: asText(row.later),
      };
    })
    .filter((item): item is StructureChoice => Boolean(item));

  const endings = (Array.isArray(statesRaw.endings) ? statesRaw.endings : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = asText(row.name);
      if (!name) return null;
      return {
        name,
        stats: asText(row.stats) || '无',
        events: asText(row.events) || '无',
        forbid: asText(row.forbid) || '无',
        finalChoice: asText(row.finalChoice) || '无',
        trigger: asText(row.trigger) || '玩家选择',
        priority: asText(row.priority),
      };
    })
    .filter((item): item is StructureEnding => Boolean(item));

  const simulations = (Array.isArray(statesRaw.simulations) ? statesRaw.simulations : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const route = asText(row.route);
      if (!route) return null;
      return {
        route,
        choices: asText(row.choices),
        stats: asText(row.stats),
        facts: asText(row.facts),
        expected: asText(row.expected),
        actual: asText(row.actual),
        pass: asBool(row.pass),
      };
    })
    .filter((item): item is StructureSimulation => Boolean(item));

  return {
    flowchart,
    nodeState: {
      nodes,
      play: asText(statesRaw.play || nodeStateRaw.play),
      stats,
      facts,
      choices,
      endings,
      simulations,
    },
  };
}

function flowById(nodes: FlowNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function canReach(start: string, target: string, byId: Map<string, FlowNode>, stopId = ''): boolean {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const id = stack.pop();
    if (!id || id === stopId && id !== target) continue;
    if (id === target) return true;
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    if (id === stopId) continue;
    stack.push(...byId.get(id)!.next);
  }
  return false;
}

function reachable(start: string, byId: Map<string, FlowNode>, stopId = ''): Set<string> {
  const out = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const id = stack.pop();
    if (!id || out.has(id) || !byId.has(id)) continue;
    out.add(id);
    if (stopId && id === stopId) continue;
    for (const next of byId.get(id)!.next) stack.push(next);
  }
  return out;
}

function depthTo(start: string, target: string, byId: Map<string, FlowNode>): number {
  const queue: Array<[string, number]> = [[start, 0]];
  const seen = new Set<string>();
  while (queue.length) {
    const [id, depth] = queue.shift()!;
    if (id === target) return depth;
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    for (const next of byId.get(id)!.next) queue.push([next, depth + 1]);
  }
  return 99;
}

function findMerge(node: FlowNode, byId: Map<string, FlowNode>, stopId = ''): string {
  const named = [node.mergeAt, ...node.next.map((id) => byId.get(id)?.mergeAt || '')].find(
    (id) => id && byId.has(id) && id !== node.id && id !== stopId,
  );
  if (named && node.next.every((start) => start === named || canReach(start, named, byId, stopId))) return named;
  if (node.next.length < 2) return '';
  const sets = node.next.map((id) => reachable(id, byId, stopId));
  const shared = [...sets[0]].filter((id) => id !== stopId && sets.every((set) => set.has(id)) && !node.next.includes(id));
  if (!shared.length) {
    if (stopId && node.next.every((start) => start === stopId || canReach(start, stopId, byId))) return stopId;
    return '';
  }
  shared.sort((a, b) => {
    const da = node.next.reduce((sum, start) => sum + depthTo(start, a, byId), 0);
    const db = node.next.reduce((sum, start) => sum + depthTo(start, b, byId), 0);
    return da - db;
  });
  return shared[0] || '';
}

function walkFlow(id: string, byId: Map<string, FlowNode>, placed: Set<string>, stopId = ''): FlowTree | null {
  if (!id || id === stopId || placed.has(id)) return null;
  const node = byId.get(id);
  if (!node) return null;
  placed.add(id);
  const outs = node.next.filter((next) => byId.has(next));
  if (outs.length <= 1) {
    const nxt = outs[0] && outs[0] !== stopId ? walkFlow(outs[0], byId, placed, stopId) : null;
    return { type: 'node', node, next: nxt };
  }
  const mergeId = findMerge(node, byId, stopId);
  const arms = outs
    .map((start) => walkFlow(start, byId, placed, mergeId || stopId))
    .filter((arm): arm is FlowTree => Boolean(arm));
  const join = mergeId && mergeId !== stopId ? walkFlow(mergeId, byId, placed, stopId) : null;
  return { type: 'fork', node, arms, join };
}

function collectFlowIds(tree: FlowTree, used: Set<string>) {
  used.add(tree.node.id);
  if (tree.type === 'node') {
    if (tree.next) collectFlowIds(tree.next, used);
    return;
  }
  for (const arm of tree.arms) collectFlowIds(arm, used);
  if (tree.join) collectFlowIds(tree.join, used);
}

/** 按 next 把流程图走成一棵带分叉和汇合的树。汇合点只出现一次。 */
export function layoutStoryFlow(nodes: FlowNode[]): FlowTree | null {
  if (!nodes.length) return null;
  const byId = flowById(nodes);
  const incoming = new Set<string>();
  for (const node of nodes) {
    for (const id of node.next) if (byId.has(id)) incoming.add(id);
  }
  const root = nodes.find((node) => !incoming.has(node.id)) || nodes[0];
  return walkFlow(root.id, byId, new Set());
}

export function layoutFlowPieces(nodes: FlowNode[]): FlowTree[] {
  const trees: FlowTree[] = [];
  let left = nodes;
  while (left.length) {
    const tree = layoutStoryFlow(left);
    if (!tree) break;
    trees.push(tree);
    const used = new Set<string>();
    collectFlowIds(tree, used);
    const next = left.filter((node) => !used.has(node.id));
    if (next.length === left.length) break;
    left = next;
  }
  return trees;
}

export function structureStatDefs(data: StoryStructure): StatDef[] {
  return data.nodeState.stats
    .filter((stat) => stat.name.trim())
    .map((stat) => ({
      id: stat.name.trim(),
      name: stat.name.trim(),
      initial: stat.initial,
      min: stat.min,
      max: stat.max,
      visible: stat.visible,
    }));
}

export function structureFactLabels(data: StoryStructure): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fact of data.nodeState.facts) {
    const key = fact.key.trim();
    if (key) out[key] = fact.means.trim() || key;
  }
  return out;
}

function sameLabel(a: string, b: string) {
  return a.trim() === b.trim();
}

function choiceNext(data: StoryStructure, row: StructureChoice) {
  const flow = data.flowchart.find((node) => sameLabel(node.id, row.node));
  const table = data.nodeState.nodes.find((node) => sameLabel(node.id, row.node));
  const index = table?.options.findIndex((option) => sameLabel(option.text, row.option)) ?? -1;
  if (index >= 0 && flow?.next[index]) return flow.next[index];
  return flow?.next[0] || '';
}

function ledgerPieces(stats: string, facts: string) {
  const parts: string[] = [];
  if (stats.trim() && stats.trim() !== '无') parts.push(stats.trim());
  if (facts.trim() && facts.trim() !== '无') {
    parts.push(/^记下/.test(facts.trim()) ? facts.trim() : `记下:${facts.trim()}`);
  }
  return parts.join('，');
}

export function matchStructureChoice(data: StoryStructure, nodeId: string, optionText: string, nextId = '') {
  const rows = data.nodeState.choices.filter(
    (row) => sameLabel(row.node, nodeId) || row.node.includes(nodeId) || nodeId.includes(row.node),
  );
  if (!rows.length) return null;
  const option = optionText.trim();
  const byOption = rows.find(
    (row) => sameLabel(row.option, option) || row.option.includes(option) || option.includes(row.option),
  );
  if (byOption) return byOption;
  if (nextId) {
    const byNext = rows.find((row) => choiceNext(data, row) === nextId);
    if (byNext) return byNext;
  }
  return rows.length === 1 ? rows[0] : null;
}

export function structureChoiceLedger(data: StoryStructure, nodeId: string, optionText: string, nextId = '') {
  const row = matchStructureChoice(data, nodeId, optionText, nextId);
  return row ? ledgerPieces(row.stats, row.facts) : '';
}

export function structureEndingLedger(data: StoryStructure, endingName: string) {
  const row = data.nodeState.endings.find(
    (item) => sameLabel(item.name, endingName) || item.name.includes(endingName) || endingName.includes(item.name),
  );
  if (!row) return '';
  const parts: string[] = [];
  if (row.stats.trim() && row.stats.trim() !== '无') {
    parts.push(row.stats.replace(/≥|≧/g, '>=').replace(/≤|≦/g, '<='));
  }
  if (row.events.trim() && row.events.trim() !== '无') {
    for (const event of row.events.split(/[、,，]/)) {
      const key = event.trim();
      if (key) parts.push(`需:${key}`);
    }
  }
  if (row.forbid.trim() && row.forbid.trim() !== '无') {
    for (const item of row.forbid.split(/[、,，]/)) {
      const key = item.trim();
      if (key) parts.push(`禁:${key}`);
    }
  }
  return parts.join('，');
}

export function structureChoicePrompt(data: StoryStructure) {
  return data.nodeState.choices
    .map((row) => {
      const extras = ledgerPieces(row.stats, row.facts);
      const next = choiceNext(data, row) || '下一节点';
      return extras ? `- ${row.option} → ${next} （${extras}）` : `- ${row.option} → ${next}`;
    })
    .join('\n');
}

export function emptyChoiceLedger(choice: Pick<StoryChoice, 'effects' | 'setFacts' | 'conditions'>) {
  const noEffects = !choice.effects || Object.keys(choice.effects).length === 0;
  const noFacts = !choice.setFacts || choice.setFacts.length === 0;
  const noCond = !choice.conditions;
  return noEffects && noFacts && noCond;
}

export function sceneNamesFromStructure(raw: string) {
  const parsed = parseStructure(raw);
  if (!parsed) return [];
  const byId = flowById(parsed.flowchart);
  const incoming = new Set<string>();
  for (const node of parsed.flowchart) {
    for (const id of node.next) if (byId.has(id)) incoming.add(id);
  }
  const root = parsed.flowchart.find((node) => !incoming.has(node.id)) || parsed.flowchart[0];
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (!id || seen.has(id) || !byId.has(id)) return;
    seen.add(id);
    out.push(id);
    for (const next of byId.get(id)!.next) visit(next);
  };
  if (root) visit(root.id);
  for (const node of parsed.flowchart) if (!seen.has(node.id)) out.push(node.id);
  return out;
}

export function readStructure(messages: ChatMessage[], chaptersDoc = '') {
  return parseStructure(chaptersDoc) || parseStructure(latestStructureRaw(messages));
}

/** 故事设计文档这一轮写完并且内容变了，才重做结构。正文续写不触发。 */
export function shouldRefreshStructure(opts: {
  userText: string;
  designBefore: string;
  designAfter: string;
  assistant: string;
}) {
  const after = opts.designAfter.trim();
  const before = opts.designBefore.trim();
  if (!after || after === before) return false;
  const assistant = opts.assistant || '';
  const wroteDesign = /===DOC:design\+?===/.test(assistant);
  const wroteProse = /===DOC:prose\+?===/.test(assistant);
  if (wroteProse && !wroteDesign) return false;
  return true;
}

export function revisionForStructure(userText: string, designBefore: string) {
  const visible = userText.split('\n--------')[0].trim();
  const firstDesign =
    !designBefore.trim() &&
    (/开始设计|就用推荐|请写【故事设计】|用户已确认选题/.test(visible) || visible.length < 40);
  if (firstDesign && !/改|不要|删|换成/.test(visible)) {
    return '无。按当前故事设计和上面的讨论，全新编写。';
  }
  return visible;
}
