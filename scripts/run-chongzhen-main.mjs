#!/usr/bin/env node
/**
 * 主流程实测：魂穿崇祯拯救大明
 * 选题 → 故事设计 → 结构 JSON → 文风锁定 → 按流程图写完全书正文
 * 可重复执行，已有成品会跳过。
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

const MODEL = process.env.OPENROUTER_TEXT_MODEL || 'deepseek/deepseek-v4.1-flash';
const API_KEY = process.env.OPENROUTER_API_KEY;
const OUT = path.join(root, 'output', 'eval', 'chongzhen-main');
fs.mkdirSync(OUT, { recursive: true });

const THEME =
  '长篇。就按这个主题来：魂穿崇祯拯救大明。拯救成功和失败都可以作为结局。先选题。';

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}
function readOut(name) {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function countHan(text) {
  return Array.from(text || '').filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}
function clip(text, n) {
  const t = (text || '').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}\n\n……（已截）`;
}
function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  process.stdout.write(`${msg}\n`);
  fs.appendFileSync(path.join(OUT, 'run.log'), `${msg}\n`);
}

function extractDoc(text, kind) {
  const re = new RegExp(`===DOC:${kind}\\+?===\\s*([\\s\\S]*?)===END_DOC===`, 'g');
  const parts = [];
  let m;
  while ((m = re.exec(text))) parts.push(m[1].trim());
  return parts.join('\n\n');
}

function pickTitle(topic) {
  const text = topic.replace(/\*\*/g, '');
  const recBlock = (text.split(/##\s*推荐/)[1] || '').trim();
  const rec = recBlock.match(/[《「]([^》」]{2,80})[》」]/);
  if (rec) return rec[1].trim();
  const rec2 = text.match(/推荐[^\n《]*[《「]([^》」]+)[》」]/);
  if (rec2) return rec2[1].trim();
  const named = [...text.matchAll(/[#]{2,3}[^\n]*[《]([^》]+)[》]/g)].pop();
  if (named) return named[1].trim();
  return '';
}

function pickStyleName(styleDoc) {
  const locked = styleDoc.match(/##\s*已锁定[：:·\s]*([^\n]+)/);
  if (locked) return locked[1].replace(/[《》「」]/g, '').trim();
  const rec = styleDoc.match(/推荐[^\n「《]*[「《]([^」》]+)[」》]/);
  return rec ? rec[1].replace(/[《》「」]/g, '').trim() : '';
}

function withLockedStyle(prompt, styleDoc) {
  const m = styleDoc.match(/##\s*已锁定[\s\S]*/);
  if (!m) return prompt;
  return `${prompt}

-------- 已锁定文风，写正文时必须守住 --------
${m[0].trim()}
这段例子是标尺。句子长短、视角、热不热、解释多不多、内心多不多，都按它写。不要写成说明书，也不要中途换腔。`;
}

function proseHeadings(text) {
  const ids = [];
  const re = /^##\s+(.+)$/gm;
  let m;
  while ((m = re.exec(text || ''))) {
    const title = m[1].trim().replace(/[《》]/g, '');
    if (title && title !== '本场准备') ids.push(title);
  }
  return ids;
}

function missingNodes(flowIds, prose) {
  const heads = proseHeadings(prose);
  return flowIds.filter((id) => !heads.some((h) => h === id || h.startsWith(`${id} `) || h.startsWith(`${id}·`)));
}

function parseJsonObject(raw) {
  let text = (raw || '').trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    try {
      return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

function flowIdsOf(structure) {
  const flow = structure?.flowchart;
  if (!Array.isArray(flow)) return [];
  return flow.map((n) => String(n?.id || '').trim()).filter(Boolean);
}

function extractJsonArray(text, key) {
  const marker = `"${key}"`;
  const i = text.indexOf(marker);
  if (i < 0) return null;
  const start = text.indexOf('[', i);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let p = start; p < text.length; p++) {
    const ch = text[p];
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
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ']') {
        try {
          return JSON.parse(text.slice(start, p + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function reasoningFromDelta(delta) {
  if (!delta || typeof delta !== 'object') return '';
  if (typeof delta.reasoning === 'string') return delta.reasoning;
  if (typeof delta.reasoning_content === 'string') return delta.reasoning_content;
  if (delta.reasoning && typeof delta.reasoning === 'object') {
    if (typeof delta.reasoning.content === 'string') return delta.reasoning.content;
    if (typeof delta.reasoning.text === 'string') return delta.reasoning.text;
  }
  return '';
}

function openRouter(payload, onData) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        family: 4,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Spark Story Studio',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => {
          raw += c.toString('utf8');
          if (onData) onData(raw);
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 502, raw });
        });
      },
    );
    req.setTimeout(40 * 60 * 1000, () => req.destroy(new Error('TimeoutError')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function chat(systemPrompt, messages, draftName, opts = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await chatOnce(systemPrompt, messages, draftName, opts);
    } catch (err) {
      lastErr = err;
      const retryable = /500|502|503|Timeout|aborted|empty model|ECONNRESET|ETIMEDOUT|socket|fetch failed/i.test(
        String(err),
      );
      if (!retryable || attempt === 4) throw err;
      log(`${draftName} retry ${attempt}: ${err.message || err}`);
      await new Promise((r) => setTimeout(r, 8000 * attempt));
    }
  }
  throw lastErr;
}

async function chatOnce(systemPrompt, messages, draftName, opts) {
  const payload = {
    model: MODEL,
    temperature: opts.temperature ?? 0.85,
    stream: true,
    max_tokens: opts.max_tokens ?? 32768,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  };
  if (opts.json) {
    payload.response_format = { type: 'json_object' };
    payload.reasoning = { enabled: true, max_tokens: 1024, exclude: true };
  } else if (opts.reasoning !== false) {
    payload.reasoning = { enabled: true, effort: opts.effort || 'high', exclude: false };
  }

  let lastSaved = 0;
  const { status, raw } = await openRouter(payload, (soFar) => {
    if (!draftName) return;
    const parsed = consumeSse(soFar);
    if (parsed.text.length - lastSaved < 500) return;
    lastSaved = parsed.text.length;
    save(`_draft-${draftName}.md`, parsed.text);
    process.stdout.write(`\r${draftName} ${parsed.text.length} chars   `);
  });
  if (status >= 400) {
    if (opts.json && status === 400 && /response_format|json_object/i.test(raw)) {
      delete payload.response_format;
      const again = await openRouter(payload);
      if (again.status >= 400) throw new Error(`OpenRouter ${again.status}: ${again.raw.slice(0, 800)}`);
      return finishSse(again.raw, draftName);
    }
    throw new Error(`OpenRouter ${status}: ${raw.slice(0, 800)}`);
  }
  return finishSse(raw, draftName);
}

function finishSse(raw, draftName) {
  const parsed = consumeSse(raw);
  if (draftName && parsed.text) save(`_draft-${draftName}.md`, parsed.text);
  log(`${draftName} done chars=${parsed.text.length} han=${countHan(parsed.text)} think=${parsed.thinking.length}`);
  if (!parsed.text.trim()) throw new Error(`${draftName} empty model output`);
  return parsed;
}

function consumeSse(raw) {
  let text = '';
  let thinking = '';
  let rest = raw;
  const lines = rest.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta || {};
      thinking += reasoningFromDelta(delta);
      text += delta.content || '';
    } catch {
      /* incomplete sse line */
    }
  }
  return { text, thinking };
}

function structureTask(designDoc) {
  return {
    role: 'user',
    content: `下面是主笔已经写完的故事设计，以及编辑最新的修改意见。你没有上一份结构稿。只根据上面的讨论、这份设计和这条修改意见，输出一份完整 JSON。第一个字符是 {，不要解释。状态表里的数值和结局门槛，沿用设计中的「数值系统设计」，不要另起一套。

--- 故事设计（故事主线与结局、角色圣经、数值系统设计）---
${designDoc.trim()}

--- 编辑最新修改意见 ---
无。按当前故事设计和上面的讨论，全新编写。`,
  };
}

function slimHistory(title, topicDoc, designDoc, styleDoc, structureText, prose, userPrompt) {
  const heads = proseHeadings(prose);
  const tail = (prose || '').trim().slice(-900);
  return [
    { role: 'user', content: `已确认《${title}》。不要换书。设定按设计走。` },
    { role: 'assistant', content: `已锁定《${title}》。` },
    {
      role: 'user',
      content: `选题摘要：\n${clip(topicDoc, 2800)}\n\n故事设计：\n${clip(designDoc, 4000)}\n\n最新节点表、状态表和故事流程图：\n${clip(structureText, 12000)}`,
    },
    { role: 'assistant', content: '选题、设计和最新流程图已记住。' },
    { role: 'user', content: withLockedStyle('文风已锁定。后面每一场都对照例子写。', styleDoc) },
    { role: 'assistant', content: '文风已锁定。' },
    {
      role: 'user',
      content: `已经写进同一份小说正文的节点：${heads.join('、') || '（还没有）'}。续写时节点名必须对上，不要另开一份正文。\n\n上一场结尾：\n${tail || '（还没有正文）'}\n\n${userPrompt}`,
    },
  ];
}

function continuePrompt(missing, written) {
  const next = missing[0];
  return `继续往下写。接在已经写好的同一份小说正文后面，用 ===DOC:prose+=== 只追加新节点。不要重贴已经写完的节点。已经写过：${written.slice(0, 40).join('、') || '（还没有）'}。还缺这些节点：${missing.slice(0, 16).join('、')}。下一场先写「${next}」。节点名必须和最新故事流程图一字不差。`;
}

function writeStatus(extra) {
  const topic = readOut('选题.md');
  const design = readOut('故事设计.md');
  const structureRaw = readOut('结构.json');
  const structure = structureRaw ? parseJsonObject(structureRaw) : null;
  const style = readOut('文风.md');
  const prose = readOut('小说正文.md');
  const ids = flowIdsOf(structure);
  const status = {
    updatedAt: new Date().toISOString(),
    title: readOut('title.txt').trim(),
    styleName: readOut('style.txt').trim(),
    han: {
      topic: countHan(topic),
      design: countHan(design),
      structure: countHan(structureRaw),
      style: countHan(style),
      prose: countHan(prose),
    },
    checks: {
      topic: countHan(topic) > 200,
      designHasMain: /主线/.test(design),
      designHasBible: /角色/.test(design),
      designHasStats: /数值/.test(design),
      designNoFlowJson: !/"flowchart"/.test(design),
      structureParsed: Boolean(structure),
      flowNodes: ids.length,
      stateStats: Array.isArray(structure?.states?.stats) ? structure.states.stats.length : 0,
      endings: Array.isArray(structure?.states?.endings) ? structure.states.endings.length : 0,
      styleLocked: /##\s*已锁定/.test(style),
      proseNodes: proseHeadings(prose).length,
      missing: structure ? missingNodes(ids, prose) : [],
    },
    ...extra,
  };
  save('status.json', JSON.stringify(status, null, 2));
  return status;
}

async function main() {
  if (!API_KEY) throw new Error('缺少 OPENROUTER_API_KEY');
  const writer = fs.readFileSync(path.join(root, 'lib', 'system-prompt.md'), 'utf8');
  const structurer = fs.readFileSync(path.join(root, 'lib', 'structure-prompt.md'), 'utf8');
  log(`model ${MODEL}`);

  let topic = readOut('选题.md');
  let title = readOut('title.txt').trim();
  if (countHan(topic) < 200) {
    log('=== topic ===');
    const reply = await chat(writer, [{ role: 'user', content: THEME }], '01-topic');
    topic = reply.text.trim();
    save('选题.md', topic);
    title = pickTitle(topic);
    save('title.txt', title);
  }
  if (!title) title = pickTitle(topic);
  log(`title: ${title || '(未抽出书名)'}`);
  writeStatus({ stage: 'topic' });

  let design = readOut('故事设计.md');
  if (countHan(design) < 400 || !/数值/.test(design)) {
    log('=== design ===');
    const ask = title ? `就用《${title}》，开始设计。` : '就用推荐的';
    const reply = await chat(
      writer,
      [
        { role: 'user', content: THEME },
        { role: 'assistant', content: clip(topic, 12000) },
        { role: 'user', content: ask },
      ],
      '02-design',
    );
    design = extractDoc(reply.text, 'design') || reply.text;
    save('故事设计.md', design.trim());
    const picked = pickTitle(design) || title;
    if (picked) {
      title = picked;
      save('title.txt', title);
    }
  }
  writeStatus({ stage: 'design' });

  let structureRaw = readOut('结构.json');
  let structure = structureRaw ? parseJsonObject(structureRaw) : null;
  if (!structure || flowIdsOf(structure).length < 4) {
    log('=== structure ===');
    const history = [
      { role: 'user', content: THEME },
      { role: 'assistant', content: clip(topic, 8000) },
      { role: 'user', content: title ? `就用《${title}》，开始设计。` : '就用推荐的' },
      { role: 'assistant', content: clip(design, 12000) },
      structureTask(design),
    ];
    const savedDraft = readOut('_draft-03-structure-1.md');
    const flowchart = extractJsonArray(savedDraft, 'flowchart');
    if (!flowchart || flowchart.length < 4) {
      const reply = await chat(structurer, history, '03-flowchart', {
        temperature: 0.3,
        json: true,
      });
      const parsed = parseJsonObject(reply.text) || { flowchart: extractJsonArray(reply.text, 'flowchart') };
      if (!parsed?.flowchart || parsed.flowchart.length < 4) throw new Error('流程图 JSON 解析失败');
      structure = parsed;
    } else {
      structure = { flowchart };
      log(`reused flowchart ${flowchart.length}`);
    }
    const ids = flowIdsOf(structure);
    if (!Array.isArray(structure.nodes) || structure.nodes.length < ids.length) {
      const reply = await chat(
        structurer,
        [
          {
            role: 'user',
            content: `流程图节点已经定死，不要改名、不要增删。只输出 {"nodes":[...]}。id 必须和这份清单一字不差，顺序一致。每个字符串不超过 40 个字。\n\n${ids.join('、')}\n\n设计里的数值名：\n${clip(design, 1800)}`,
          },
        ],
        '03-nodes',
        { temperature: 0.3, json: true },
      );
      const nodes = parseJsonObject(reply.text)?.nodes || extractJsonArray(reply.text, 'nodes');
      if (!Array.isArray(nodes) || nodes.length < 4) throw new Error('节点表 JSON 解析失败');
      structure.nodes = nodes;
    }
    if (!structure.states?.stats) {
      const reply = await chat(
        structurer,
        [
          {
            role: 'user',
            content: `只输出 {"states":{...}}。数值名字、起点、结局门槛必须沿用下面的数值系统设计，不要另起一套。stats、facts、choices、endings、simulations 都要有。\n\n${clip(design, 4000)}\n\n选择节点：${ids.join('、')}`,
          },
        ],
        '03-states',
        { temperature: 0.3, json: true },
      );
      const states = parseJsonObject(reply.text)?.states;
      if (!states?.stats) throw new Error('状态表 JSON 解析失败');
      structure.states = states;
    }
    structureRaw = JSON.stringify(structure, null, 2);
    save('结构.json', structureRaw);
  }
  const flowIds = flowIdsOf(structure);
  log(`flow nodes ${flowIds.length}: ${flowIds.join(' | ')}`);
  writeStatus({ stage: 'structure' });

  let style = readOut('文风.md');
  let styleName = readOut('style.txt').trim();
  if (countHan(style) < 120) {
    log('=== style ===');
    const reply = await chat(
      writer,
      [
        {
          role: 'user',
          content: `《${title || '这本书'}》的设计可以。推荐几种写法。\n\n写例子时用这份设计里的人和场面，不要另起一本：\n${clip(design, 2500)}`,
        },
      ],
      '04-style',
    );
    style = reply.text.trim();
    save('文风.md', style);
  }
  styleName = pickStyleName(style) || styleName;
  if (!/##\s*已锁定/.test(style)) {
    log(`=== lock style ${styleName || '?'} ===`);
    const name = styleName || '推荐的那种';
    const reply = await chat(
      writer,
      [
        { role: 'assistant', content: clip(style, 8000) },
        { role: 'user', content: `文风就用「${name}」。` },
      ],
      '04-style-lock',
    );
    const locked = reply.text.trim();
    if (/已锁定/.test(locked)) style = locked;
    else style = `${style.trim()}\n\n${locked}`;
    save('文风.md', style);
    styleName = pickStyleName(style) || name;
  }
  save('style.txt', styleName);
  writeStatus({ stage: 'style' });

  let prose = readOut('小说正文.md');
  const maxRounds = Math.max(flowIds.length + 4, 12);
  for (let i = 0; i < maxRounds; i++) {
    const missing = missingNodes(flowIds, prose);
    writeStatus({ stage: 'prose', round: i, missing: missing.length });
    if (!missing.length) {
      log('all flowchart nodes written');
      break;
    }
    const started = proseHeadings(prose).length > 0;
    const prompt = started
      ? withLockedStyle(continuePrompt(missing, proseHeadings(prose)), style)
      : withLockedStyle('开始写正文。', style);
    const draft = started ? `05-prose-${String(i + 1).padStart(2, '0')}` : '05-prose-start';
    log(`=== ${draft} missing ${missing.length} next ${missing[0]} ===`);
    const history = slimHistory(title || '这本书', topic, design, style, structureRaw, prose, prompt);
    let reply;
    try {
      reply = await chat(writer, history, draft);
    } catch (err) {
      log(`${draft} failed: ${err.message || err}`);
      continue;
    }
    const added = (extractDoc(reply.text, 'prose') || reply.text).trim();
    const before = missingNodes(flowIds, prose).length;
    prose = `${prose.trim()}\n\n${added}\n`.trim() + '\n';
    save('小说正文.md', prose);
    const after = missingNodes(flowIds, prose).length;
    log(`prose han=${countHan(prose)} missing ${before} -> ${after}`);
    if (after >= before) {
      log(`no new node from ${draft}, stop retrying this round`);
    }
  }

  const status = writeStatus({ stage: 'done' });
  log(`DONE title=${status.title} proseHan=${status.han.prose} missing=${status.checks.missing.length}`);
}

main().catch((err) => {
  log(`FATAL ${err.stack || err}`);
  try {
    writeStatus({ stage: 'fatal', error: String(err.message || err) });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
