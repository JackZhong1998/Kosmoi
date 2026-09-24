import { hasLockedStyle, withLockedStyle } from './parse-docs';
import {
  isBookComplete,
  lastSceneTail,
  missingScenes,
  parseStoryMapScenes,
  writtenSceneNames,
} from './parse-story';
import { PHASE_STARTERS } from './system-prompt';
import type { ChatMessage, DocKind, StoryData } from './types';

export const MAX_AUTO_ROUNDS = 40;

export type AutoStepKind = 'design' | 'style' | 'lockStyle' | 'proseStart' | 'proseContinue';

export type AutoStep =
  | { kind: 'needTopic' }
  | { kind: 'done' }
  | {
      kind: AutoStepKind;
      fallback: DocKind;
      prompt: string;
      slimHistory?: ChatMessage[];
    };

export function canStartFullWrite(opts: {
  showPicker: boolean;
  topicDoc: string;
  hasTopicPicks: boolean;
  complete: boolean;
}) {
  if (opts.showPicker || opts.complete) return false;
  return Boolean(opts.topicDoc.trim() || opts.hasTopicPicks);
}

function clip(text: string, n: number) {
  const t = (text || '').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}\n\n……（已截）`;
}

function mapExcerpt(designDoc: string, structureText = '') {
  if (structureText.trim()) return clip(structureText, 12000);
  const idx = designDoc.search(/故事地图/);
  if (idx >= 0) return clip(designDoc.slice(idx), 8000);
  return clip(designDoc, 5000);
}

export function proseContinuePrompt(missing: string[], written: string[]) {
  const next = missing[0];
  const miss = missing.slice(0, 16).join('、') || '（流程图上尚未写完的节点）';
  const have = written.slice(0, 40).join('、') || '（还没有）';
  const nextLine = next
    ? `下一场先写「${next}」。节点名必须和最新故事流程图一字不差。若这个节点正文里已有半截，请输出这个节点的完整版（可以重贴这一场），不要另开一份正文。`
    : '按最新故事流程图写下一条未写完的支，写到汇合或结局再停。';
  return `继续往下写。接在已经写好的同一份小说正文后面，用 ===DOC:prose+=== 只追加新节点。不要重贴已经写完的节点。已经写过：${have}。还缺这些节点：${miss}。${nextLine}`;
}

export function slimProseHistory(opts: {
  title: string;
  topicDoc: string;
  designDoc: string;
  styleDoc: string;
  story: StoryData;
  userPrompt: string;
  structureText?: string;
}): ChatMessage[] {
  const written = writtenSceneNames(opts.story);
  const tail = lastSceneTail(opts.story);
  return [
    {
      role: 'user',
      content: `已确认《${opts.title}》。不要换书。设定按设计走。`,
    },
    { role: 'assistant', content: `已锁定《${opts.title}》。` },
    {
      role: 'user',
      content: `选题摘要：\n${clip(opts.topicDoc, 2800)}\n\n故事设计：\n${clip(opts.designDoc, 4000)}\n\n最新节点表、状态表和故事流程图：\n${mapExcerpt(opts.designDoc, opts.structureText)}`,
    },
    { role: 'assistant', content: '选题、设计和最新流程图已记住。' },
    {
      role: 'user',
      content: withLockedStyle('文风已锁定。后面每一场都对照例子写。', opts.styleDoc),
    },
    { role: 'assistant', content: '文风已锁定。' },
    {
      role: 'user',
      content: `已经写进同一份小说正文的节点：${written.join('、') || '（还没有）'}。续写时节点名必须对上，不要另开一份正文。\n\n上一场结尾：\n${tail || '（还没有正文）'}\n\n${opts.userPrompt}`,
    },
  ];
}

export function nextAutoStep(input: {
  topicDoc: string;
  designDoc: string;
  styleDoc: string;
  proseDoc: string;
  story: StoryData;
  title: string;
  styleName: string;
  structureText?: string;
  mapNames?: string[];
}): AutoStep {
  const title = input.title.trim() || '未命名故事';
  const styleName = input.styleName.trim() || '烟火白话';
  const styleLocked = hasLockedStyle(input.styleDoc);
  const proseStarted = Object.keys(input.story.nodes).length > 0;

  if (!input.designDoc.trim()) {
    if (!input.topicDoc.trim() && title === '未命名故事') return { kind: 'needTopic' };
    return { kind: 'design', fallback: 'design', prompt: '就用推荐的' };
  }
  if (!input.styleDoc.trim() && !proseStarted) {
    return { kind: 'style', fallback: 'style', prompt: PHASE_STARTERS.style(title) };
  }
  if (!styleLocked && !proseStarted) {
    return { kind: 'lockStyle', fallback: 'style', prompt: PHASE_STARTERS.lockStyle(styleName) };
  }
  if (isBookComplete(input.designDoc, input.story, true, input.mapNames)) return { kind: 'done' };

  if (!input.proseDoc.trim() || Object.keys(input.story.nodes).length === 0) {
    const prompt = withLockedStyle(PHASE_STARTERS.proseStart, input.styleDoc);
    return {
      kind: 'proseStart',
      fallback: 'prose',
      prompt,
      slimHistory: slimProseHistory({ ...input, title, userPrompt: prompt }),
    };
  }

  const missing = missingScenes(input.designDoc, input.story, input.mapNames);
  const prompt = withLockedStyle(
    PHASE_STARTERS.proseContinue(proseContinuePrompt(missing, writtenSceneNames(input.story))),
    input.styleDoc,
  );
  return {
    kind: 'proseContinue',
    fallback: 'prose',
    prompt,
    slimHistory: slimProseHistory({ ...input, title, userPrompt: prompt }),
  };
}

export function autoWriteProgress(designDoc: string, story: StoryData, mapNames?: string[]) {
  const mapCount = mapNames && mapNames.length ? mapNames.length : parseStoryMapScenes(designDoc).length;
  const written = Object.keys(story.nodes).length;
  const missing = missingScenes(designDoc, story, mapNames).length;
  return { written, missing, mapCount };
}
