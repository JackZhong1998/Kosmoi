#!/usr/bin/env node
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
const OUT = path.join(root, 'output');
fs.mkdirSync(OUT, { recursive: true });
const messagesPath = path.join(OUT, 'messages.json');

const PHASE_TOPIC = fs.existsSync(path.join(OUT, '选题文档.md'))
  ? null
  : `请进入【阶段一：选题】，产出完整选题文档。目标是火花评测样本：深度叙事文字互动小说。先写产品定位，再给 3 个差异足够大的候选。不要编造调研数据。可推荐但不可替用户确认。不要写设计或正文。`;

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}

function loadMessages() {
  if (!fs.existsSync(messagesPath)) return [];
  return JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
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

async function chat(messages, { temperature = 0.85, max_tokens = 24576 } = {}) {
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
        /* ignore malformed sse */
      }
    }
  }
  process.stdout.write(`\nstream done ${text.length} chars, han ${countHan(text)}\n`);
  if (!text) throw new Error('empty model output');
  return text;
}

function bootstrapFromTopic() {
  const topic = fs.readFileSync(path.join(OUT, '选题文档.md'), 'utf8');
  let messages = loadMessages();
  if (messages.length >= 2) return messages;
  messages = [
    {
      role: 'user',
      content:
        PHASE_TOPIC ||
        '请进入【阶段一：选题】，产出完整选题文档。',
    },
    { role: 'assistant', content: topic },
  ];
  saveMessages(messages);
  return messages;
}

async function ensureDesign(title) {
  if (fs.existsSync(path.join(OUT, '故事设计文档.md'))) {
    const existing = fs.readFileSync(path.join(OUT, '故事设计文档.md'), 'utf8');
    if (countHan(existing) > 6000 && /状态表|结局卡|节点表/.test(existing)) {
      console.log('design already present, han=', countHan(existing));
      return existing;
    }
  }
  let messages = bootstrapFromTopic();
  const part1 = `用户已确认选题《${title}》。请进入【阶段二：故事设计】的前四项，写完整：
1. 故事主线与结局（含每张结局卡，4 个有实质差异的结局）
2. 角色圣经（含四段短样本）
3. 全部 11 张章节卡
4. 完整故事流程图（纯文本树）

规模：共同主线 11 章；大分支不超过 3；1 个核心可见数值真相 + 关系数值人心 + 职业数值声望 + 必要事实标记。不要写节点表、状态表和正文。`;
  messages.push({ role: 'user', content: part1 });
  console.log('design part 1...');
  const d1 = await chat(messages);
  messages.push({ role: 'assistant', content: d1 });
  saveMessages(messages);

  const part2 = `继续完成故事设计后两项，必须写完：
5. 节点表（每一章的关键节点都要有）+ 伏笔账本
6. 状态表：数值定义、每个选择效果、结局条件、从结局反推、多结局裁决顺序、至少 8 条路线模拟

不要重复前四项全文。不要写正文。写完后请用户确认。`;
  messages.push({ role: 'user', content: part2 });
  console.log('design part 2...');
  const d2 = await chat(messages);
  messages.push({ role: 'assistant', content: d2 });
  saveMessages(messages);
  const design = `${d1.trim()}\n\n---\n\n${d2.trim()}`;
  save('故事设计文档.md', design);
  console.log('design saved, han=', countHan(design));
  return design;
}

async function writeProse() {
  let messages = loadMessages();
  let prose = fs.existsSync(path.join(OUT, '小说正文.md'))
    ? fs.readFileSync(path.join(OUT, '小说正文.md'), 'utf8')
    : '';

  if (!prose.includes('===STORY_PATCH===')) {
    const start = `用户已确认故事设计。请进入【阶段三：正文】。
先用不超过 10 行列出全部节点 id 目录，然后立刻写出第一章完整 STORY_PATCH（必须含 meta 与本章全部节点，含小/中分支和汇合节点）。
书名《磁带修复师》。严格遵守 JSON 标记格式。`;
    messages.push({ role: 'user', content: start });
    console.log('prose chapter 1...');
    const first = await chat(messages, { temperature: 0.9 });
    messages.push({ role: 'assistant', content: first });
    saveMessages(messages);
    prose = first;
    save('小说正文.md', prose);
  }

  for (let i = 0; i < 18; i++) {
    const { nodes } = extractPatches(prose);
    const list = Object.values(nodes);
    const endings = list.filter((n) => n.isEnding).length;
    const missing = list.flatMap((n) => (n.choices || []).filter((c) => c.next && !nodes[c.next]).map((c) => c.next));
    const han = list.reduce((s, n) => s + countHan(n.body || ''), 0);
    console.log(`loop ${i}: nodes=${list.length} endings=${endings} missing=${missing.length} han=${han}`);
    if (endings >= 3 && missing.length === 0 && han >= 80000) break;
    if (endings >= 4 && missing.length === 0 && i >= 12) break;
    const hint =
      missing.length > 0
        ? `还缺节点：${[...new Set(missing)].slice(0, 16).join('、')}。请把它们连同本章其余节点写完。当前汉字约 ${han}。`
        : `请写下一章完整 STORY_PATCH（可省略 meta）。已有节点 ${list.length}，结局 ${endings}，汉字约 ${han}。目标约 10 万字，写到全部结局为止。人物声音、事实标记、数值 id 必须与设计一致。`;
    messages.push({
      role: 'user',
      content: `继续写作。${hint}\n只输出本章 STORY_PATCH。不要重复已写节点。`,
    });
    console.log('prose next...');
    const chunk = await chat(messages, { temperature: 0.9 });
    messages.push({ role: 'assistant', content: chunk });
    saveMessages(messages);
    prose = `${prose.trim()}\n\n${chunk}`;
    save('小说正文.md', prose);
  }
  const finalHan = countHan(extractPatches(prose).nodes ? Object.values(extractPatches(prose).nodes).map((n) => n.body || '').join('') : prose);
  console.log('prose done, file han=', countHan(prose), 'body han~', finalHan);
}

const mode = process.argv[2] || 'pipeline';
const title = process.argv[3] || '磁带修复师';

if (mode === 'topic') {
  const messages = [{ role: 'user', content: PHASE_TOPIC || '请进入【阶段一：选题】，产出完整选题文档。' }];
  const text = await chat(messages);
  messages.push({ role: 'assistant', content: text });
  saveMessages(messages);
  save('选题文档.md', text);
} else if (mode === 'design') {
  await ensureDesign(title);
} else if (mode === 'prose') {
  await writeProse();
} else if (mode === 'pipeline') {
  await ensureDesign(title);
  await writeProse();
} else {
  console.log('usage: node scripts/run-eval.mjs topic|design|prose|pipeline [title]');
}
