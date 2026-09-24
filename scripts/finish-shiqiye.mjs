#!/usr/bin/env node
/**
 * Finish 《十七日·夜》 from existing prologue through three endings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'output', 'stories', 'shiqiye');
const EVAL = path.join(root, 'output', 'eval', 'chongzhen', 'r4');
fs.mkdirSync(OUT, { recursive: true });

function loadSystemPrompt() {
  return fs.readFileSync(path.join(root, 'lib', 'system-prompt.md'), 'utf8');
}

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}

function extractDoc(text, kind) {
  const re = new RegExp(`===DOC:${kind}\\+?===\\s*([\\s\\S]*?)===END_DOC===`, 'g');
  const parts = [];
  let m;
  while ((m = re.exec(text))) parts.push(m[1].trim());
  return parts.join('\n\n');
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
  process.stdout.write(`\n${draftName} done ${text.length} chars, think ${thinking.length}\n`);
  if (!text) throw new Error(`${draftName} empty model output`);
  return text;
}

function stripExistingHeaders(chunk, existing) {
  const ids = [...existing.matchAll(/^##\s+(\S+)/gm)].map((m) => m[1]);
  if (!ids.length) return chunk;
  const parts = chunk.split(/^##\s+/m);
  const keep = [parts[0]];
  for (const part of parts.slice(1)) {
    const id = part.match(/^(\S+)/)?.[1];
    if (id && ids.includes(id)) continue;
    keep.push(`## ${part}`);
  }
  return keep.join('').trim();
}

const STEPS = [
  {
    name: 'ch1',
    hint: `请写第一章全部节点，写透，不要提纲。已经写过的序章不要重贴。

必须写出这些门牌：
## n01 · 屏风后
（第一章 屏风后）
周皇后从屏风后出来，先看案上那两样东西还在不在，再开口。三人第一次摊牌。章尾选项：
- 先跟王承恩把南迁的事定下来 → n02a
- 先跟周皇后把孩子的事定下来 → n02b
- 先召魏藻德，问守城实情 → n02c

## n02a · 先定南迁
当场反应写够。记下:read_map 已经可能有。选项只接到 n03merge。
## n02b · 先定孩子
当场反应写够。选项 → n03merge（记下:promised_queen）
## n02c · 先问守城
魏藻德进殿说城守可恃。当场反应写够。选项 → n03merge
## n03merge · 太子上殿
太子被带进来，去留第一次上台面。用同一件正在发生的事汇合，不要写「不管你刚才选了什么」。用 {{if:promised_queen}} {{if:read_map}} 接住差异。选项：
- 召见那个进城递信的人 → n04
- 先不见来使，让王承恩去挡 → n04

用 ===DOC:prose+=== 包住。`,
  },
  {
    name: 'ch2',
    hint: `请写第二章全部节点。已经写过的不要重贴。

## n04 · 口信
（第二章 口信）
三月十八日白天，唐通到了。选项：
- 召见，当面听他开条件 → n05a (记下:met_envoy)
- 不见，杀来使 → n05b (记下:killed_envoy)
- 让王承恩代见，自己在屏后听 → n05c (记下:met_envoy)

## n05a · 当面听
条件里必须有一条不能答应的（交出国玺）。写透。→ n06merge
## n05b · 杀来使
血在殿门外。不是英雄。→ n06merge
## n05c · 屏后听
唐通跟王承恩说的，和当面不一样。→ n06merge
## n06merge · 孩子怎么办
周皇后问孩子怎么办。她不是问走不走，是问孩子排第几。{{if:met_envoy}} {{if:killed_envoy}}
选项：
- 今晚把太子的事做个了断 → n07

用 ===DOC:prose+=== 包住。`,
  },
  {
    name: 'ch3',
    hint: `请写第三章全部节点。已经写过的不要重贴。

## n07 · 太子
（第三章 太子）
三月十八日夜。周皇后把刀放上桌：「陛下走，臣妾不拖累；陛下留，臣妾也不拖累。」选项：
- 送太子出城，交给可靠的人 → n08a (记下:sent_crown_prince,promised_queen)
- 留下太子，一起走或一起留 → n08b (记下:promised_stay)
- 把太子托给魏藻德这种朝臣 → n08c

## n08a · 送出去
周皇后第一次看你超过三秒。→ n09merge
## n08b · 留下
太子看你一眼，去练字。→ n09merge
## n08c · 托给朝臣
周皇后当场没说话。→ n09merge
## n09merge · 最后一夜
王承恩报：德胜门、正阳门、安定门，只剩这几处。用 {{if}} 接住太子去留。选项：
- 等到天亮，去最后那扇门 → n10

用 ===DOC:prose+=== 包住。`,
  },
  {
    name: 'ch4',
    hint: `请写第四章和三个结局。已经写过的不要重贴。每个结局都要有只有这条路才看得到的场面，写透，下面不要再跟选项。

## n10 · 最后的门
（第四章 最后的门）
三月十九日晨。城破在即。选项按状态开放：
- 出城，往南走 → ending-1 (需其一:read_map|promised_queen, 禁:promised_stay)
- 留下，去煤山 → ending-2
- 开城谈 → ending-3 (需:met_envoy, 禁:killed_envoy)

## ending-1 · 南迁
出城回头，紫禁城在火光里，王承恩没跟上来。
## ending-2 · 死守
煤山那棵树下，问王承恩「朕是不是不该生在这家」，他把外袍铺在树根上。
## ending-3 · 开城
承天门，素服，李自成的马停在面前，他下马还是不下马取决于 met_envoy 怎么见的。用 {{if}}。

用 ===DOC:prose+=== 包住。`,
  },
];

async function main() {
  const systemPrompt = loadSystemPrompt();
  const topic = fs.readFileSync(path.join(OUT, '选题文档.md'), 'utf8');
  const design = fs.readFileSync(path.join(OUT, '故事设计文档.md'), 'utf8');
  const chapters = fs.readFileSync(path.join(OUT, '章节卡.md'), 'utf8');
  let prose = fs.readFileSync(path.join(OUT, '小说正文.md'), 'utf8');

  const base = [
    {
      role: 'user',
      content: `这是已确认的短篇《十七日·夜》。主题：魂穿崇祯拯救大明。序章已经写完。请按设计把后文写完。

【选题节选】
${topic.slice(0, 1800)}

【故事设计】
${design}

【章节卡】
${chapters}`,
    },
    {
      role: 'assistant',
      content: `已读完设计。序章在右侧。后文按节点表写，Markdown，选项用「- 做法 → 门牌」。`,
    },
  ];

  for (const step of STEPS) {
    if (
      (step.name === 'ch1' && prose.includes('## n01')) ||
      (step.name === 'ch2' && prose.includes('## n04')) ||
      (step.name === 'ch3' && prose.includes('## n07')) ||
      (step.name === 'ch4' && prose.includes('## ending-1'))
    ) {
      process.stdout.write(`skip ${step.name}, already in prose\n`);
      continue;
    }
    process.stdout.write(`\n=== ${step.name} ===\n`);
    const messages = [
      ...base,
      { role: 'user', content: `【已写正文】\n${prose}\n\n${step.hint}` },
    ];
    const reply = await chat(systemPrompt, messages, step.name);
    const added = extractDoc(reply, 'prose') || reply;
    const cleaned = stripExistingHeaders(added, prose);
    prose = `${prose.trim()}\n\n${cleaned.trim()}\n`;
    save('小说正文.md', prose);
    fs.copyFileSync(path.join(OUT, '小说正文.md'), path.join(EVAL, '04-小说正文.md'));
  }

  process.stdout.write(`\nfinished ${OUT}/小说正文.md  chars ${prose.length}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
