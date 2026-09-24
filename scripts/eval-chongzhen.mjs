#!/usr/bin/env node
/**
 * Evaluate the writer System Prompt on a fixed theme:
 * 魂穿崇祯拯救大明
 * topic → design → chapters → prologue (+ first branches)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME = '魂穿崇祯拯救大明';
const ROUND = String(process.argv[2] || '1');
const OUT = path.join(root, 'output', 'eval', 'chongzhen', `r${ROUND}`);
fs.mkdirSync(OUT, { recursive: true });

function loadSystemPrompt() {
  return fs.readFileSync(path.join(root, 'lib', 'system-prompt.md'), 'utf8');
}

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}

function countHan(text) {
  return Array.from(text || '').filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}

function extractDoc(text, kind) {
  const re = new RegExp(`===DOC:${kind}\\+?===\\s*([\\s\\S]*?)===END_DOC===`, 'g');
  const parts = [];
  let m;
  while ((m = re.exec(text))) parts.push(m[1].trim());
  return parts.join('\n\n');
}

function pickTitle(topic) {
  const recBlock = (topic.split(/##\s*推荐/)[1] || '').trim();
  const rec = recBlock.match(/[《「]([^》」]{2,40})[》」]/);
  if (rec) return rec[1].trim();
  const rec2 = topic.match(/推荐[^\n《]*[《「]([^》」]+)[》」]/);
  if (rec2) return rec2[1].trim();
  const rec3 = topic.match(/推荐[：:]\s*([^\n。]+)/);
  if (rec3) return rec3[1].replace(/[《》「」]/g, '').trim();
  const named = [...topic.matchAll(/[#]{2,3}[^\n]*[《]([^》]+)[》]/g)].pop();
  if (named) return named[1].trim();
  return THEME;
}

function reasoningFromDelta(delta) {
  if (!delta || typeof delta !== 'object') return '';
  if (typeof delta.reasoning === 'string') return delta.reasoning;
  if (typeof delta.reasoning_content === 'string') return delta.reasoning_content;
  if (delta.reasoning && typeof delta.reasoning === 'object') {
    if (typeof delta.reasoning.content === 'string') return delta.reasoning.content;
    if (typeof delta.reasoning.text === 'string') return delta.reasoning.text;
  }
  if (Array.isArray(delta.reasoning_details)) {
    return delta.reasoning_details
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
        return '';
      })
      .join('');
  }
  return '';
}

async function chat(systemPrompt, messages, draftName) {
  let text = '';
  let thinking = '';
  const persist = () => {
    if (draftName && text) save(`${draftName}.md`, text);
    if (draftName && thinking) save(`${draftName}.thinking.md`, thinking);
  };
  const res = await fetch('http://127.0.0.1:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, temperature: 0.85 }),
    signal: AbortSignal.timeout(18 * 60 * 1000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`/api/generate ${res.status}: ${(await res.text()).slice(0, 1200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta || {};
        const think = reasoningFromDelta(delta);
        if (think) thinking += think;
        const chunk = delta.content || '';
        if (chunk) {
          text += chunk;
          if (text.length % 500 < chunk.length) {
            process.stdout.write(`\r${draftName} ${text.length} chars  think ${thinking.length}   `);
            persist();
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  persist();
  process.stdout.write(`\n${draftName} done ${text.length} chars, han ${countHan(text)}, think ${thinking.length}\n`);
  if (!text) throw new Error(`${draftName} empty model output`);
  return { text, thinking };
}

const PHASE = {
  topic: `请写【选题】。

主题硬约束：${THEME}。三个候选都必须落在这个主题里，差异来自切入角度、共同主线、人物关系和结局代价，不要三个换皮，也不要写成穿越说明书，更不要靠再塞一个穿越者来凑不同。

短篇规模：序章 + 4 章 + 3 个有实质差别的结局。第一次选择必须是眼前这件事的做法，不要三件国事并列。像在跟编辑谈一本书，不要填表。不要写故事设计、章节卡或正文。

前面说几句人话，完整选题用 ===DOC:topic=== 包住，里面是 Markdown。`,
  design: (title) => `用户已确认选题《${title}》。

请写【故事设计】。顺序：共同主线与结局、人物、节点表、数值状态表，最后才是故事流程图。节点表和数值状态表用简单纯文本，不要做成数据库字段。不要写章节卡和正文。

前面说几句人话，完整设计用 ===DOC:design=== 包住，里面是 Markdown。`,
  chapters: (title) => `用户已确认《${title}》的故事设计。请写【章节卡】。

序章卡必须写清开头怎么钩人。节点表已经在设计里，这里不要重抄。不要写正文。

前面说几句人话，完整章节卡用 ===DOC:chapters=== 包住，里面是 Markdown。`,
  proseStart: `用户已确认章节卡。请开始写【正文】。

现在是在写小说。先写序章这一个场面，写透。用 Markdown：标题、正文、选项用「- 做法 → 门牌」。不要 JSON。不要一次把所有支路写成提纲。

前面说几句人话，正文用 ===DOC:prose=== 包住。`,
  proseContinue: `继续写。请把序章分出去的那几条当场反应写完，并汇合到序章汇合点。仍然是写小说：一个场面写透，Markdown，选项用「- 做法 → 门牌」。已经写过的不要重贴。用 ===DOC:prose+=== 追加。`,
};

async function main() {
  const systemPrompt = loadSystemPrompt();
  save('00-system-prompt.md', systemPrompt);
  const messages = [];

  process.stdout.write(`\n=== round ${ROUND} topic ===\n`);
  messages.push({ role: 'user', content: PHASE.topic });
  const topicReply = await chat(systemPrompt, messages, '01-topic-raw');
  messages.push({ role: 'assistant', content: topicReply.text });
  const topicDoc = extractDoc(topicReply.text, 'topic') || topicReply.text;
  save('01-选题.md', topicDoc);
  const title = pickTitle(topicDoc);
  save('01-title.txt', title);
  process.stdout.write(`picked title: ${title}\n`);

  process.stdout.write(`\n=== round ${ROUND} design ===\n`);
  messages.push({ role: 'user', content: PHASE.design(title) });
  const designReply = await chat(systemPrompt, messages, '02-design-raw');
  messages.push({ role: 'assistant', content: designReply.text });
  const designDoc = extractDoc(designReply.text, 'design') || designReply.text;
  save('02-故事设计.md', designDoc);

  process.stdout.write(`\n=== round ${ROUND} chapters ===\n`);
  messages.push({ role: 'user', content: PHASE.chapters(title) });
  const chaptersReply = await chat(systemPrompt, messages, '03-chapters-raw');
  messages.push({ role: 'assistant', content: chaptersReply.text });
  const chaptersDoc = extractDoc(chaptersReply.text, 'chapters') || chaptersReply.text;
  save('03-章节卡.md', chaptersDoc);

  process.stdout.write(`\n=== round ${ROUND} prose prologue ===\n`);
  messages.push({ role: 'user', content: PHASE.proseStart });
  const proseReply = await chat(systemPrompt, messages, '04-prose-raw');
  messages.push({ role: 'assistant', content: proseReply.text });
  let proseDoc = extractDoc(proseReply.text, 'prose') || proseReply.text;

  process.stdout.write(`\n=== round ${ROUND} prose branches ===\n`);
  messages.push({ role: 'user', content: PHASE.proseContinue });
  const moreReply = await chat(systemPrompt, messages, '05-prose-continue-raw');
  const moreDoc = extractDoc(moreReply.text, 'prose');
  if (moreDoc) proseDoc = `${proseDoc}\n\n${moreDoc}`;
  else proseDoc = `${proseDoc}\n\n${moreReply.text}`;
  save('04-小说正文.md', proseDoc);

  save(
    'meta.json',
    JSON.stringify(
      {
        round: ROUND,
        theme: THEME,
        title,
        han: {
          topic: countHan(topicDoc),
          design: countHan(designDoc),
          chapters: countHan(chaptersDoc),
          prose: countHan(proseDoc),
        },
        think: {
          topic: topicReply.thinking.length,
          design: designReply.thinking.length,
          chapters: chaptersReply.thinking.length,
          prose: proseReply.thinking.length,
          proseContinue: moreReply.thinking.length,
        },
      },
      null,
      2,
    ),
  );
  process.stdout.write(`\nround ${ROUND} saved to ${OUT}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
