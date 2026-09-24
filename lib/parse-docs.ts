import type { DocKind, StudioDocs } from './types';
import { mergeProseAppend } from './parse-story';

export const DOC_KINDS: DocKind[] = ['topic', 'design', 'chapters', 'style', 'prose'];

export const DOC_LABEL: Record<DocKind, string> = {
  topic: '选题文档',
  design: '故事设计文档',
  chapters: '章节卡',
  style: '文风',
  prose: '小说正文',
};

export type DocUpdate = {
  kind: DocKind;
  content: string;
  append: boolean;
  complete: boolean;
};

const CLOSE = '===END_DOC===';
const PATCH_OPEN = '===STORY_PATCH===';
const PATCH_CLOSE = '===END_STORY_PATCH===';

function isKind(v: string): v is DocKind {
  return v === 'topic' || v === 'design' || v === 'chapters' || v === 'style' || v === 'prose';
}

export function emptyDocs(): StudioDocs {
  return { topic: '', design: '', chapters: '', style: '', prose: '' };
}

export function extractLockedStyle(styleDoc: string): string {
  if (!styleDoc) return '';
  const m = styleDoc.match(/##\s*已锁定[\s\S]*/);
  return m ? m[0].trim() : '';
}

export function hasLockedStyle(styleDoc: string): boolean {
  return /##\s*已锁定/.test(styleDoc);
}

export function lockedStyleName(styleDoc: string): string {
  const m = styleDoc.match(/##\s*已锁定[：:·\s]*([^\n]+)/);
  if (!m) return '';
  return m[1].replace(/[《》「」]/g, '').trim();
}

const EDITOR_TALK_HEAD =
  /^(?:设计到这里|请你(?:定|确认|看)|三件事你定一下)|你定一下|我就往下走|往下走文风/;

function isEditorTalk(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const head = t.slice(0, 200).replace(/^#+\s*/, '');
  if (EDITOR_TALK_HEAD.test(head)) return true;
  return /(?:行不行|对不对|够不够|味道对不对|这样定)/.test(head) && /[？?]|你/.test(head);
}

export type Candidate = { n: number; name: string };

const CANDIDATE_MARK: Record<string, number> = { 一: 1, 二: 2, 三: 3, '1': 1, '2': 2, '3': 3 };

/** 从选题或文风稿里抽出「候选一 / 候选二 / 候选三」。 */
export function parseCandidates(text: string): Candidate[] {
  if (!text.trim()) return [];
  const found = new Map<number, string>();
  const re = /\*{0,2}候选\s*([一二三123])\s*[·、.:：]\s*(.*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = CANDIDATE_MARK[m[1]];
    if (!n) continue;
    const rest = m[2].replace(/\*+/g, '').trim();
    const head = rest.split(/[。．]|——|参照/)[0].trim();
    const book = head.match(/《([^》]+)》/);
    const quoted = head.match(/^「([^」]+)」/);
    const name = (book?.[1] || quoted?.[1] || head).trim().slice(0, 24);
    if (name) found.set(n, name);
  }
  return [...found.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 3)
    .map(([n, name]) => ({ n, name }));
}

/** 文档末尾问编辑的话（「设计到这里。三件事你定一下」）应进对话框，不进文档。 */
export function peelEditorTalk(content: string): { doc: string; talk: string } {
  const text = content.trim();
  if (!text) return { doc: '', talk: '' };
  const hr = text.match(/^([\s\S]*?)\n---+\s*\n+([\s\S]+)$/);
  if (hr && isEditorTalk(hr[2])) {
    return { doc: hr[1].trim(), talk: hr[2].trim() };
  }
  const ask = text.match(/^([\s\S]*?)\n+(设计到这里[^\n]*[\s\S]*)$/);
  if (ask && isEditorTalk(ask[2])) {
    return { doc: ask[1].trim(), talk: ask[2].trim() };
  }
  return { doc: text, talk: '' };
}

export function withLockedStyle(prompt: string, styleDoc: string): string {
  const locked = extractLockedStyle(styleDoc);
  if (!locked) return prompt;
  return `${prompt}

-------- 已锁定文风，写正文时必须守住 --------
${locked}
这段例子是标尺。句子长短、视角、热不热、解释多不多、内心多不多，都按它写。不要写成说明书，也不要中途换腔。`;
}

const STRUCTURE_ANNO_RE =
  /^[（(](?=[^）)\n]{0,180}(?:线性|选择|分支|汇合|结局))[^）)\n]{1,180}[）)]\s*$/;

function sceneTitleFromLine(line: string): string {
  const bare = line
    .trim()
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\*+|\*+$/g, '')
    .trim();
  if (!bare || bare.length > 24) return '';
  if (/[。！？?!]/.test(bare)) return '';
  if (/本场准备|读者进来|这一场/.test(bare)) return '';
  if (!/[\u4e00-\u9fffA-Za-z0-9]/.test(bare)) return '';
  return bare;
}

function narrativeChars(prose: string): number {
  const kept = prose
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (/^#{1,3}\s/.test(t)) return false;
      if (STRUCTURE_ANNO_RE.test(t)) return false;
      if (t.startsWith('>')) return false;
      if (/^[-*]\s+/.test(t) && /本场|读者|这一场|不能出现|要动|要写成/.test(t)) return false;
      return true;
    })
    .join('');
  return (kept.match(/[\u4e00-\u9fff]/g) || []).length;
}

function isProseDump(prose: string): boolean {
  const hasAnno = prose.split('\n').some((line) => STRUCTURE_ANNO_RE.test(line.trim()));
  if (!hasAnno) return false;
  const hasSceneMark =
    /本场准备/.test(prose) || /下一章\s*(?:→|->)/.test(prose) || /^\s*[-*]\s+.+(?:→|->)/m.test(prose);
  return hasSceneMark && narrativeChars(prose) >= 80;
}

function peelTrailingTalk(prose: string): { prose: string; talk: string } {
  const paras = prose.trim().split(/\n{2,}/);
  const tail: string[] = [];
  while (paras.length > 1) {
    const last = paras[paras.length - 1].trim();
    if (!last || (!isEditorTalk(last) && !/^(?:写好了|这场写完了|你看)/.test(last))) break;
    tail.unshift(paras.pop() || '');
  }
  return { prose: paras.join('\n\n').trim(), talk: tail.join('\n\n').trim() };
}

/** 模型忘了包 ===DOC:prose=== 时，把场面从对话里捞出来。 */
export function salvageUnmarkedProse(chat: string): { prose: string; chat: string } | null {
  const text = chat.replace(/\r\n/g, '\n').replace(/^```[a-zA-Z]*\s*$/gm, '');
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!STRUCTURE_ANNO_RE.test(lines[i].trim())) continue;
    let j = i - 1;
    while (j >= 0 && !lines[j].trim()) j--;
    if (j >= 0 && sceneTitleFromLine(lines[j])) {
      start = j;
      break;
    }
  }
  if (start < 0) return null;
  const peeled = peelTrailingTalk(lines.slice(start).join('\n').replace(/```/g, '').trim());
  const titled = peeled.prose.replace(/^[ \t]*(\*+)?/, '');
  const firstBreak = titled.indexOf('\n');
  const head = (firstBreak === -1 ? titled : titled.slice(0, firstBreak)).trim();
  const title = sceneTitleFromLine(head);
  if (!title) return null;
  const rest = firstBreak === -1 ? '' : titled.slice(firstBreak + 1);
  const prose = `## ${title}\n${rest}`.trim();
  if (!isProseDump(prose)) return null;
  return {
    prose,
    chat: [lines.slice(0, start).join('\n').trim(), peeled.talk].filter(Boolean).join('\n\n'),
  };
}

/** 从助手回复里抽出文档块；对话区只保留标记外的话。流式时未闭合的块也会作为预览更新。 */
export function parseAssistantPayload(text: string): {
  updates: DocUpdate[];
  chat: string;
  talk: string;
  hasStoryPatch: boolean;
  rawPatches: string;
} {
  const updates: DocUpdate[] = [];
  const talks: string[] = [];
  const skip: Array<[number, number]> = [];
  let searchFrom = 0;

  const openRe = /===DOC:(topic|design|chapters|style|prose)(\+)?===/g;
  while (searchFrom < text.length) {
    openRe.lastIndex = searchFrom;
    const open = openRe.exec(text);
    if (!open || open.index === undefined) break;
    const kind = open[1];
    if (!isKind(kind)) {
      searchFrom = open.index + open[0].length;
      continue;
    }
    const bodyStart = open.index + open[0].length;
    const closeAt = text.indexOf(CLOSE, bodyStart);
    const complete = closeAt !== -1;
    const bodyEnd = complete ? closeAt : text.length;
    let content = text.slice(bodyStart, bodyEnd).trim();
    if (kind === 'design' && complete) {
      const peeled = peelEditorTalk(content);
      content = peeled.doc;
      if (peeled.talk) talks.push(peeled.talk);
    }
    updates.push({ kind, content, append: open[2] === '+', complete });
    skip.push([open.index, complete ? closeAt + CLOSE.length : text.length]);
    searchFrom = complete ? closeAt + CLOSE.length : text.length;
  }

  const patchChunks: string[] = [];
  let patchFrom = 0;
  while (patchFrom < text.length) {
    const start = text.indexOf(PATCH_OPEN, patchFrom);
    if (start === -1) break;
    const bodyStart = start + PATCH_OPEN.length;
    const closeAt = text.indexOf(PATCH_CLOSE, bodyStart);
    const complete = closeAt !== -1;
    const end = complete ? closeAt + PATCH_CLOSE.length : text.length;
    patchChunks.push(text.slice(start, end).trim());
    skip.push([start, end]);
    patchFrom = end;
  }

  skip.sort((a, b) => a[0] - b[0]);
  let chat = '';
  let cursor = 0;
  for (const [a, b] of skip) {
    if (a < cursor) continue;
    chat += text.slice(cursor, a);
    cursor = b;
  }
  chat += text.slice(cursor);

  const rawPatches = patchChunks.join('\n\n');
  if (rawPatches && !updates.some((u) => u.kind === 'prose')) {
    updates.push({ kind: 'prose', content: rawPatches, append: true, complete: text.includes(PATCH_CLOSE) });
  }

  let chatOut = chat.replace(/\n{3,}/g, '\n\n').trim();
  if (!updates.some((u) => u.kind === 'prose')) {
    const lifted = salvageUnmarkedProse(chatOut);
    if (lifted) {
      updates.push({ kind: 'prose', content: lifted.prose, append: false, complete: true });
      chatOut = lifted.chat;
    }
  }

  const talk = talks.join('\n\n').trim();
  return {
    updates,
    chat: chatOut,
    talk,
    hasStoryPatch: patchChunks.length > 0,
    rawPatches,
  };
}

/** 正文文档是空的时候，把对话里漏出来的场面补回去。文档里已经有的正文不动。 */
export function foldChatProse(proseDoc: string, messages: Array<{ role: string; content: string }>): string {
  if ((proseDoc || '').trim()) return proseDoc;
  let prose = '';
  for (const message of messages) {
    if (message.role !== 'assistant' || !message.content.trim()) continue;
    for (const update of parseAssistantPayload(message.content).updates) {
      if (update.kind !== 'prose' || !update.content.trim()) continue;
      const incoming = update.content.trim();
      prose = prose.trim() ? mergeProseAppend(prose, incoming, { replaceFinished: true }) : `${incoming}\n`;
    }
  }
  return prose;
}

export function applyDocUpdates(docs: StudioDocs, updates: DocUpdate[]): StudioDocs {
  const next = { ...docs };
  for (const update of updates) {
    if (!update.content) continue;
    const content =
      update.kind === 'design' && update.complete !== false ? peelEditorTalk(update.content).doc : update.content;
    if (!content) continue;
    if (update.append && next[update.kind].trim()) {
      next[update.kind] =
        update.kind === 'prose'
          ? mergeProseAppend(next[update.kind], content)
          : `${next[update.kind].trim()}\n\n${content}`;
    } else {
      next[update.kind] = content;
    }
  }
  return next;
}

/** 旧样本把章节卡、节点表写在设计文档里，加载时拆到章节卡文档。 */
export function splitLegacyChapterCards(design: string): { design: string; chapters: string } {
  if (!design) return { design: '', chapters: '' };
  const chapterMatch = design.match(/\n## 三、章节卡[^\n]*\n([\s\S]*?)(?=\n## [四五]、)/);
  const nodeMatch = design.match(/\n## 五、节点表[^\n]*\n([\s\S]*?)(?=\n## 六、)/);
  const parts: string[] = [];
  if (chapterMatch) parts.push(`## 章节卡\n\n${chapterMatch[1].trim()}`);
  if (nodeMatch) parts.push(`## 节点表\n\n${nodeMatch[1].trim()}`);
  let next = design;
  if (chapterMatch) next = next.replace(/\n## 三、章节卡[^\n]*\n[\s\S]*?(?=\n## [四五]、)/, '\n');
  if (nodeMatch) next = next.replace(/\n## 五、节点表[^\n]*\n[\s\S]*?(?=\n## 六、)/, '\n');
  return {
    design: next.trim() + '\n',
    chapters: parts.length ? `${parts.join('\n\n')}\n` : '',
  };
}

export function lastUpdatedKind(updates: DocUpdate[]): DocKind | null {
  for (let i = updates.length - 1; i >= 0; i--) {
    if (updates[i].content) return updates[i].kind;
  }
  return null;
}
