#!/usr/bin/env node
/**
 * Short closed-loop eval for the iterated System Prompt.
 * Reference structure: 完蛋了！我被美女包围了 (structure only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SYSTEM_PROMPT = fs.readFileSync(path.join(root, 'lib/system-prompt.md'), 'utf8');
const MODEL = process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash';
const API_KEY = process.env.OPENROUTER_API_KEY;
const OUT = path.join(root, 'output', 'short');
fs.mkdirSync(OUT, { recursive: true });
const messagesPath = path.join(OUT, 'messages.json');

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}
function loadMessages() {
  return fs.existsSync(messagesPath) ? JSON.parse(fs.readFileSync(messagesPath, 'utf8')) : [];
}
function saveMessages(messages) {
  save('messages.json', JSON.stringify(messages, null, 2));
}
function countHan(text) {
  return Array.from(text).filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}
function extractPatches(text) {
  const re = /===STORY_PATCH===([\s\S]*?)===END_STORY_PATCH===/g;
  const nodes = {};
  let meta = null;
  let m;
  while ((m = re.exec(text))) {
    try {
      const obj = JSON.parse(m[1].trim().replace(/,\s*([}\]])/g, '$1'));
      if (obj.meta) meta = obj.meta;
      for (const n of obj.nodes || []) if (n?.id) nodes[n.id] = n;
    } catch (err) {
      console.warn('skip patch', err.message);
    }
  }
  return { meta, nodes };
}

async function chat(messages, { temperature = 0.88, max_tokens = 24576 } = {}) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Spark Story Studio Eval',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens,
      stream: true,
      reasoning: { max_tokens: 512 },
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
    signal: AbortSignal.timeout(8 * 60 * 1000),
  });
  if (!res.ok || !res.body) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 1200)}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
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
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          text += delta;
          if (text.length % 500 < delta.length) process.stdout.write(`\rstream ${text.length} chars   `);
        }
      } catch {
        /* ignore */
      }
    }
  }
  if (!text) {
    console.warn('empty stream, retrying once without prior assistant dumps...');
    throw new Error('empty model output');
  }
  return text;
}

function pickTitle(topicDoc) {
  const rec = topicDoc.match(/我推荐[^\n《]*《([^》]+)》/);
  if (rec) return rec[1];
  const any = topicDoc.match(/候选[一二三123].*?《([^》]+)》/);
  return any ? any[1] : '短篇闭环样本';
}

const TOPIC = `请进入【阶段一：选题】，只产出选题文档。

这是短篇闭环评测。参考《完蛋了！我被美女包围了》的公开结构（不抄角色与情节）：多个有自己生活的鲜明女性角色、共同困局、选择很快出现、反馈立刻落到关系，结局不能只换陪在身边的人。

硬约束：
- 先写产品定位，再给 3 个候选，推荐 1 个；
- 短篇规模：序章 + 4 章 + 3 个有实质差异的结局；
- 每个选题写清序章钩子（前 800 字内的困境、魅力登场、第一次选择）；
- 共同主线必须是外部事件，关系路线附着其上；
- 不要写设计和正文。`;

let messages = loadMessages();
const step = process.argv[2] || 'all';

if (step === 'topic' || (step === 'all' && !fs.existsSync(path.join(OUT, '选题文档.md')))) {
  messages = [{ role: 'user', content: TOPIC }];
  console.log('short topic...');
  const topic = await chat(messages);
  messages.push({ role: 'assistant', content: topic });
  saveMessages(messages);
  save('选题文档.md', topic);
}

if (step === 'design' || (step === 'all' && !fs.existsSync(path.join(OUT, '故事设计文档.md')))) {
  messages = loadMessages();
  const topic = fs.readFileSync(path.join(OUT, '选题文档.md'), 'utf8');
  const title = pickTitle(topic);
  console.log('confirm title:', title);
  messages.push({
    role: 'user',
    content: `用户已确认选题《${title}》。评测模式：进入阶段二，按短篇规模写完整六项。必须有序章卡。大分支 ≤ 2，结局 3 个且有实质差异（主角最终成为什么样的人、共同困局如何收场、代价各不同）。不要写正文。`,
  });
  console.log('short design...');
  const design = await chat(messages);
  messages.push({ role: 'assistant', content: design });
  saveMessages(messages);
  save('故事设计文档.md', design);
}

if (step === 'prose' || step === 'all') {
  const design = fs.readFileSync(path.join(OUT, '故事设计文档.md'), 'utf8');
  const slimDesign = design.length > 12000 ? design.slice(0, 12000) + '\n\n[设计后文已省略，请严格按已写节点表和状态表续写]' : design;
  let prose = fs.existsSync(path.join(OUT, '小说正文.md')) ? fs.readFileSync(path.join(OUT, '小说正文.md'), 'utf8') : '';
  let history = [
    {
      role: 'user',
      content: `用户已确认短篇设计《三十天，把店救活》。下面是设计文档（节选）：\n\n${slimDesign}`,
    },
    { role: 'assistant', content: '已读完设计。等待按章写正文。' },
  ];

  if (!prose.includes('===STORY_PATCH===')) {
    history.push({
      role: 'user',
      content: `进入阶段三。立刻写【序章】完整 STORY_PATCH（必须含 meta，start 指向序章节点 id）。遵守序章铁律：前 400–800 字内出现收铺电话/程知遥用行动证明魅力/第一次真正选择。文风：第二人称，对白密，少抒情，像短剧场面。不要写第一章。只输出目录+STORY_PATCH。`,
    });
    console.log('prologue...');
    const first = await chat(history, { temperature: 0.92 });
    history.push({ role: 'assistant', content: first });
    saveMessages(history);
    prose = first;
    save('小说正文.md', prose);
  }

  for (let i = 0; i < 8; i++) {
    const { nodes } = extractPatches(prose);
    const list = Object.values(nodes);
    const endings = list.filter((n) => n.isEnding).length;
    const missing = list.flatMap((n) => (n.choices || []).filter((c) => c.next && !nodes[c.next]).map((c) => c.next));
    const han = list.reduce((s, n) => s + countHan(n.body || ''), 0);
    console.log(`short loop ${i}: nodes=${list.length} endings=${endings} missing=${missing.length} han=${han}`);
    if (endings >= 3 && missing.length === 0 && list.length >= 8) break;
    const lastPatch = prose.slice(prose.lastIndexOf('===STORY_PATCH==='));
    const hint =
      missing.length > 0
        ? `还缺节点：${[...new Set(missing)].slice(0, 14).join('、')}。请写完。`
        : `请写下一章完整 STORY_PATCH。若序章已完成则写第一章。已有节点 ${Object.keys(nodes).join(', ')}，结局 ${endings}，汉字约 ${han}。短篇写到 3 个结局为止。`;
    const turn = [
      history[0],
      history[1],
      { role: 'user', content: `上一章正文：\n${lastPatch.slice(0, 8000)}\n\n继续。${hint}\n只输出 STORY_PATCH。` },
    ];
    const chunk = await chat(turn, { temperature: 0.92 });
    history = turn.concat([{ role: 'assistant', content: chunk }]);
    saveMessages(history);
    prose = `${prose.trim()}\n\n${chunk}`;
    save('小说正文.md', prose);
  }

  const final = extractPatches(prose);
  const leftover = Object.values(final.nodes).flatMap((n) =>
    (n.choices || []).filter((c) => c.next && !final.nodes[c.next]).map((c) => c.next),
  );
  if ([...new Set(leftover)].length > 0) {
    console.log('write endings for', [...new Set(leftover)].join(','));
    const lastPatch = prose.slice(prose.lastIndexOf('===STORY_PATCH==='));
    const chunk = await chat(
      [
        history[0],
        history[1],
        {
          role: 'user',
          content: `上一章：\n${lastPatch.slice(0, 6000)}\n\n请写出全部结局节点：${[...new Set(leftover)].join('、')}。每个结局 isEnding=true，choices 为空。三个结局必须有实质差异：主角成为什么样的人、店的最终状态、关键人物命运、代价。只输出 STORY_PATCH。`,
        },
      ],
      { temperature: 0.9 },
    );
    prose = `${prose.trim()}\n\n${chunk}`;
    save('小说正文.md', prose);
  }
}

console.log('short-loop finished');

if (step === 'endings') {
  const design = fs.readFileSync(path.join(OUT, '故事设计文档.md'), 'utf8');
  const slimDesign = design.slice(0, 8000);
  let prose = fs.readFileSync(path.join(OUT, '小说正文.md'), 'utf8');
  const { nodes } = extractPatches(prose);
  const leftover = [...new Set(Object.values(nodes).flatMap((n) =>
    (n.choices || []).filter((c) => c.next && !nodes[c.next]).map((c) => c.next),
  ))];
  console.log('leftover', leftover);
  const lastPatch = prose.slice(prose.lastIndexOf('===STORY_PATCH==='));
  const chunk = await chat(
    [
      { role: 'user', content: `已确认设计节选：\n${slimDesign}` },
      { role: 'assistant', content: '已读设计。' },
      {
        role: 'user',
        content: `上一章：\n${lastPatch.slice(0, 7000)}\n\n请写出全部结局节点 ${leftover.join('、') || 'n12、ending-keep、ending-close、ending-sell'}。每个结局 isEnding=true，choices 为空数组。三个结局必须有实质差异。只输出 STORY_PATCH。`,
      },
    ],
    { temperature: 0.9 },
  );
  save('小说正文.md', `${prose.trim()}\n\n${chunk}`);
  console.log('endings saved');
}
