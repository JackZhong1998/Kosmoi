#!/usr/bin/env node
/**
 * 按新 SP 重写《十七日·夜》：锁定原设定，重做流程图 / 按门牌落卡 / 文风 / 写到三个结局。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'output', 'stories', 'shiqiye');
const OUT = path.join(root, 'output', 'stories', 'shiqiye2');
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

function extractNodeIds(text) {
  const ids = new Set();
  const re = /\b((?:p|n)\d+[a-z]*|ending-[\w-]+)\b/gi;
  let m;
  while ((m = re.exec(text || ''))) ids.add(m[1].toLowerCase().replace(/^ending/i, (s) => s.toLowerCase()));
  return [...ids];
}

function proseIds(text) {
  const ids = [];
  const re = /^##\s+(\S+)/gm;
  let m;
  while ((m = re.exec(text || ''))) ids.push(m[1]);
  return ids;
}

function pickStyleName(styleDoc) {
  const rec =
    styleDoc.match(/推荐[^\n「《]*[「《]([^」》]+)[」》]/) ||
    styleDoc.match(/我推荐[^\n：:]*[：:]\s*[「《]?([^\n」》。]+)/) ||
    styleDoc.match(/###\s*[^\n·]*[·]\s*([^\n]+)/);
  return rec ? rec[1].replace(/[《》「」]/g, '').trim() : '冷硬史笔';
}

function withLockedStyle(prompt, styleDoc) {
  const m = styleDoc.match(/##\s*已锁定[\s\S]*/);
  if (!m) return prompt;
  return `${prompt}

-------- 已锁定文风，写正文时必须守住 --------
${m[0].trim()}
这段例子是标尺。句子长短、视角、热不热、解释多不多、内心多不多，都按它写。不要写成说明书，也不要中途换腔。`;
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
    if (draftName && text) save(`_draft-${draftName}.md`, text);
    if (draftName && thinking) save(`_draft-${draftName}.thinking.md`, thinking);
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

const TITLE = '十七日·夜';

async function main() {
  const systemPrompt = loadSystemPrompt();
  save('00-system-prompt.md', systemPrompt);

  const topicDoc = fs.readFileSync(path.join(SRC, '选题文档.md'), 'utf8');
  save('选题文档.md', topicDoc);

  const messages = [
    {
      role: 'user',
      content: `已确认选题《${TITLE}》。不要再开三个候选。人物、三天时间、三个结局（南迁 / 死守 / 开城）按下面这份选题里的「候选一」锁定。结构按新规则重做：选择要少，不要每章三岔。

${topicDoc.slice(0, 4200)}`,
    },
    { role: 'assistant', content: `已锁定《${TITLE}》。下一份写故事设计。` },
  ];

  process.stdout.write('\n=== design ===\n');
  messages.push({
    role: 'user',
    content: `用户已确认选题《${TITLE}》。设定已锁定，不要换人、换时间窗、换三个结局的方向。

请写【故事设计】。顺序：共同主线与结局、人物、节点表、数值状态表，最后才是故事流程图。流程图是写作目录：主线、每一次分岔、每一个汇合、每一个结局都要在图上，不要省略号。分岔上写记下什么、关掉哪条结局。全书 3 到 5 个真正的选择点，至少一半的拍是线性。不要写章节卡、文风和正文。

前面说几句人话，完整设计用 ===DOC:design=== 包住，里面是 Markdown。`,
  });
  const designReply = await chat(systemPrompt, messages, '02-design');
  messages.push({ role: 'assistant', content: designReply.text });
  const designDoc = extractDoc(designReply.text, 'design') || designReply.text;
  save('故事设计文档.md', designDoc);

  process.stdout.write('\n=== chapters ===\n');
  messages.push({
    role: 'user',
    content: `用户已确认《${TITLE}》的故事设计。请写【章节卡】。

按门牌落卡，不是一章一张。先列流程图上的门牌清单，再给每一个门牌写一篇：线性拍、选择拍、每一支、汇合点、每一个结局都要有。漏一张就是错。序章第一张线性卡必须写清开头怎么钩人。不要写文风和正文。

前面说几句人话，完整章节卡用 ===DOC:chapters=== 包住，里面是 Markdown。`,
  });
  const chaptersReply = await chat(systemPrompt, messages, '03-chapters');
  messages.push({ role: 'assistant', content: chaptersReply.text });
  let chaptersDoc = extractDoc(chaptersReply.text, 'chapters') || chaptersReply.text;

  const designIds = extractNodeIds(designDoc);
  const cardIds = extractNodeIds(chaptersDoc);
  const reallyMissing = designIds.filter((id) => !cardIds.some((c) => c.toLowerCase() === id.toLowerCase()));
  if (reallyMissing.length) {
    process.stdout.write(`chapters missing ${reallyMissing.join(', ')}\n`);
    messages.push({
      role: 'user',
      content: `流程图上这些门牌还没有卡：${reallyMissing.join('、')}。请只补这些卡，用 ===DOC:chapters+=== 包住。不要写正文。`,
    });
    const moreCards = await chat(systemPrompt, messages, '03-chapters-more');
    messages.push({ role: 'assistant', content: moreCards.text });
    const added = extractDoc(moreCards.text, 'chapters');
    if (added) chaptersDoc = `${chaptersDoc.trim()}\n\n${added}`;
    else chaptersDoc = `${chaptersDoc.trim()}\n\n${moreCards.text}`;
  }
  save('章节卡.md', chaptersDoc);

  process.stdout.write('\n=== style ===\n');
  messages.push({
    role: 'user',
    content: `用户已确认《${TITLE}》的章节卡。请写【文风】。

给三到四个真正不同的写法。不要三个换皮形容词。每个写法都要：名字、写给谁看、这段写法的手感，以及用当前这个故事的人物和场面写一段 150–250 字的小说例子。同一场戏，换写法就换味道。例子必须是正文，不是说明书。

推荐一个。不要写小说正文。

前面说几句人话，完整文风方案用 ===DOC:style=== 包住。`,
  });
  const styleReply = await chat(systemPrompt, messages, '04-style');
  messages.push({ role: 'assistant', content: styleReply.text });
  let styleDoc = extractDoc(styleReply.text, 'style') || styleReply.text;
  const styleName = pickStyleName(styleDoc);
  process.stdout.write(`lock style: ${styleName}\n`);
  messages.push({
    role: 'user',
    content: `用户选定文风「${styleName}」。

请把【文风】文档补上「已锁定」一节：名字、那段被选中的例子原文、三句以后写正文时要守住的提醒。候选可以留着，但已锁定必须单独成节、例子必须完整保留。不要写正文。

用 ===DOC:style=== 把改完的文风文档包回来。`,
  });
  const lockReply = await chat(systemPrompt, messages, '04-style-lock');
  messages.push({ role: 'assistant', content: lockReply.text });
  styleDoc = extractDoc(lockReply.text, 'style') || lockReply.text;
  save('文风.md', styleDoc);
  save('styleName.txt', styleName);

  process.stdout.write('\n=== prose ===\n');
  messages.push({
    role: 'user',
    content: withLockedStyle(
      `用户已确认章节卡和文风。请开始写【正文】。

现在是在写小说。先写写作目录上的第一场，写透。门牌必须和流程图、章节卡一致。如果这一场还不到必须表态的时刻，不要硬给选项，章末用「- 下一章 → 门牌」翻页。只有关键时刻才给 2 个、最多 3 个做法选项。不要每章都分支。用 Markdown。不要 JSON。文风按已锁定的那段例子写到底，不要换腔。

前面说几句人话，正文用 ===DOC:prose=== 包住。`,
      styleDoc,
    ),
  });
  const firstProse = await chat(systemPrompt, messages, '05-prose-start');
  messages.push({ role: 'assistant', content: firstProse.text });
  let proseDoc = extractDoc(firstProse.text, 'prose') || firstProse.text;
  save('小说正文.md', proseDoc);

  for (let i = 0; i < 14; i++) {
    const have = new Set(proseIds(proseDoc).map((id) => id.toLowerCase()));
    const endings = [...have].filter((id) => id.startsWith('ending-')).length;
    const missing = designIds.filter((id) => !have.has(id.toLowerCase()));
    if (endings >= 3 && missing.length === 0) {
      process.stdout.write('all nodes and 3 endings present\n');
      break;
    }
    const hint =
      missing.length > 0
        ? `还缺这些门牌：${missing.slice(0, 14).join('、')}。请按写作目录和章节卡把它们写完。已经写过的不要重贴。不要发明图上没有的节点。`
        : `请把尚未完成的结局场面写完。已经写过的不要重贴。`;
    process.stdout.write(`\n=== prose ${i + 1} missing ${missing.length} endings ${endings} ===\n`);
    messages.push({
      role: 'user',
      content: withLockedStyle(
        `继续写。${hint}

仍然是写小说：按写作目录上下一个未写的门牌写透。若不是关键选择点，写成线性章，章末用「- 下一章 → 门牌」翻页，不要硬挂两三个选项。不要发明图上没有的节点。只有真正要表态时才给 2 个、最多 3 个做法选项。已经写过的不要重贴。文风继续对照已锁定的那段例子，不要换腔。用 ===DOC:prose+=== 追加。`,
        styleDoc,
      ),
    });
    const more = await chat(systemPrompt, messages, `05-prose-${String(i + 1).padStart(2, '0')}`);
    messages.push({ role: 'assistant', content: more.text });
    const added = extractDoc(more.text, 'prose');
    proseDoc = `${proseDoc.trim()}\n\n${(added || more.text).trim()}\n`;
    save('小说正文.md', proseDoc);
  }

  save(
    'meta.json',
    JSON.stringify(
      {
        title: TITLE,
        styleName,
        han: {
          topic: countHan(topicDoc),
          design: countHan(designDoc),
          chapters: countHan(chaptersDoc),
          style: countHan(styleDoc),
          prose: countHan(proseDoc),
        },
        doors: {
          design: designIds,
          prose: proseIds(proseDoc),
        },
      },
      null,
      2,
    ),
  );
  process.stdout.write(`\nrewrite saved to ${OUT}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
