#!/usr/bin/env node
/**
 * 长篇全流程：选题 → 设计 → 章节卡 → 文风锁定 → 按门牌写正文。
 * 目标约十万汉字。可重复执行，已有文档会跳过。
 */
import fs from 'node:fs';
import { setDefaultAutoSelectFamily } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

setDefaultAutoSelectFamily(false);

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
const OUT = path.join(root, 'output', 'stories', 'longform');
fs.mkdirSync(OUT, { recursive: true });

const TARGET_HAN = 100000;
const MIN_SCENE_HAN = 2200;
const MAX_CHAPTER_ROUNDS = 8;
const MAX_PROSE_ROUNDS = 70;

function loadSystemPrompt() {
  return fs.readFileSync(path.join(root, 'lib', 'system-prompt.md'), 'utf8');
}

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}

function readOut(name) {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function hasDoc(name, min = 80) {
  return readOut(name).trim().length >= min;
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
  const ids = [];
  const seen = new Set();
  const re = /\b((?:p|n)\d+[a-z]*|ending-[\w-]+)\b/gi;
  let m;
  while ((m = re.exec(text || ''))) {
    let id = m[1];
    if (/^ending/i.test(id)) id = id.replace(/^ending/i, 'ending');
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
  }
  return ids;
}

function proseIds(text) {
  const ids = [];
  const re = /^##\s+(\S+)/gm;
  let m;
  while ((m = re.exec(text || ''))) ids.push(m[1]);
  return ids;
}

function splitNodes(text) {
  const parts = (text || '').split(/^##\s+/m);
  const header = parts[0] || '';
  const nodes = [];
  for (const chunk of parts.slice(1)) {
    const nl = chunk.indexOf('\n');
    const titleLine = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const body = nl === -1 ? '' : chunk.slice(nl + 1);
    const id = titleLine.split(/\s+/)[0];
    nodes.push({ id, titleLine, body, han: countHan(body) });
  }
  return { header, nodes };
}

function joinNodes({ header, nodes }) {
  const body = nodes.map((n) => `## ${n.titleLine}\n${n.body.trim()}\n`).join('\n');
  return `${header.trim()}\n\n${body}`.trim() + '\n';
}

function pickTitle(topic) {
  const recBlock = (topic.split(/##\s*推荐/)[1] || '').trim();
  const rec = recBlock.match(/[《「]([^》」]{2,40})[》」]/);
  if (rec) return rec[1].trim();
  const rec2 = topic.match(/推荐[^\n《]*[《「]([^》」]+)[》」]/);
  if (rec2) return rec2[1].trim();
  const named = [...topic.matchAll(/[#]{2,3}[^\n]*[《]([^》]+)[》]/g)].pop();
  if (named) return named[1].trim();
  return '未命名长篇';
}

function pickStyleName(styleDoc) {
  const rec =
    styleDoc.match(/推荐[^\n「《]*[「《]([^」》]+)[」》]/) ||
    styleDoc.match(/我推荐[^\n：:]*[：:]\s*[「《]?([^\n」》。]+)/) ||
    styleDoc.match(/##\s*已锁定[：:·\s]*([^\n]+)/);
  return rec ? rec[1].replace(/[《》「」]/g, '').trim() : '烟火白话';
}

function withLockedStyle(prompt, styleDoc) {
  const m = styleDoc.match(/##\s*已锁定[\s\S]*/);
  if (!m) return prompt;
  return `${prompt}

-------- 已锁定文风，写正文时必须守住 --------
${m[0].trim()}
这段例子是标尺。句子长短、视角、热不热、解释多不多、内心多不多，都按它写。不要写成说明书，也不要中途换腔。`;
}

function clip(text, n = 6000) {
  const t = (text || '').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}\n\n……（已截）`;
}

function flowchartOf(designDoc) {
  const idx =
    designDoc.search(/写作目录|故事流程图|-------- 故事流程图/) ;
  if (idx >= 0) return designDoc.slice(idx, idx + 8000);
  return clip(designDoc, 5000);
}

function statsOf(designDoc) {
  const idx = designDoc.search(/数值状态表/);
  if (idx >= 0) return designDoc.slice(idx, idx + 4500);
  return '';
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
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await chatOnce(systemPrompt, messages, draftName);
    } catch (err) {
      lastErr = err;
      const retryable =
        /OpenRouter (500|502)|TimeoutError|aborted|terminated|empty model output|fetch failed|Connect Timeout|ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET|other side closed|socket hang up/i.test(
          String(err?.cause?.code || '') + ' ' + String(err),
        );
      if (!retryable || attempt === 5) throw err;
      process.stdout.write(`\n${draftName} retry ${attempt}/5: ${err.cause?.code || err.message || err}\n`);
      await new Promise((r) => setTimeout(r, 10000 * attempt));
    }
  }
  throw lastErr;
}

async function chatOnce(systemPrompt, messages, draftName) {
  let text = '';
  let thinking = '';
  const persist = () => {
    if (draftName && text) save(`_draft-${draftName}.md`, text);
    if (draftName && thinking) save(`_draft-${draftName}.thinking.md`, thinking);
  };
  if (!API_KEY) throw new Error('缺少 OPENROUTER_API_KEY');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Spark Story Studio',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.85,
      stream: true,
      max_tokens: 32768,
      reasoning: { enabled: true, effort: 'high', exclude: false },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
    signal: AbortSignal.timeout(40 * 60 * 1000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 1200)}`);
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
          if (text.length % 800 < chunk.length) {
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

function slimHistory(title, topicDoc, designDoc, chaptersDoc, styleDoc) {
  return [
    {
      role: 'user',
      content: `已确认长篇选题《${title}》。不要换书。设定按设计走。`,
    },
    { role: 'assistant', content: `已锁定《${title}》。` },
    {
      role: 'user',
      content: `选题摘要：\n${clip(topicDoc, 2800)}\n\n设计里的数值与写作目录：\n${statsOf(designDoc)}\n\n${flowchartOf(designDoc)}`,
    },
    { role: 'assistant', content: '数值和写作目录已记住。' },
    {
      role: 'user',
      content: `章节卡（节选，写正文时按门牌）：\n${clip(chaptersDoc, 4500)}`,
    },
    { role: 'assistant', content: '门牌卡已记住。' },
    { role: 'user', content: withLockedStyle('文风已锁定。后面每一场都对照例子写。', styleDoc) },
    { role: 'assistant', content: '文风已锁定。' },
  ];
}

function nextMissing(designIds, proseDoc) {
  const have = new Set(proseIds(proseDoc).map((id) => id.toLowerCase()));
  return designIds.filter((id) => !have.has(id.toLowerCase()));
}

function thinnestNode(proseDoc) {
  const { nodes } = splitNodes(proseDoc);
  const ranked = nodes
    .filter((n) => n.id && !/^ending/i.test(n.id))
    .sort((a, b) => a.han - b.han);
  return ranked[0] || null;
}

function writeMeta(data) {
  save('meta.json', JSON.stringify(data, null, 2));
}

async function main() {
  const systemPrompt = loadSystemPrompt();
  save('00-system-prompt.md', systemPrompt);

  let topicDoc = readOut('选题文档.md');
  let title = readOut('01-title.txt').trim();

  if (!hasDoc('选题文档.md', 200)) {
    process.stdout.write('\n=== topic ===\n');
    const topicReply = await chat(systemPrompt, [
      {
        role: 'user',
        content: `请写【选题】。长篇。目标约十万汉字。

气质接近《完蛋了！我被美女包围了》：人物有自己的日子，要有共同困局，选择来得准、来得少，反馈落到关系上。学结构，不抄情节、不抄人物名单。不要穿越、系统、重生、后宫收编。现实向都市或小城。

规模：序章 + 十到十二章 + 五个有实质差别的结局。全书 6 到 8 个真正的选择点，至少一半的章没有选项。每章 2 到 4 个门牌，全书大约 32 到 40 个门牌，多数线性。

五个可攻略的女性，每人一根好感度。五个结局跟五个她对应。

三个候选，推荐一个。写给能一口气往下刷的男性读者。不要写故事设计、章节卡、文风或正文。

前面说几句人话，完整选题用 ===DOC:topic=== 包住，里面是 Markdown。`,
      },
    ], '01-topic');
    topicDoc = extractDoc(topicReply.text, 'topic') || topicReply.text;
    save('选题文档.md', topicDoc);
    title = pickTitle(topicDoc);
    save('01-title.txt', title);
  }
  if (!title) {
    title = pickTitle(topicDoc) || '未命名长篇';
    save('01-title.txt', title);
  }
  process.stdout.write(`title: ${title}\n`);

  let designDoc = readOut('故事设计文档.md');
  if (!hasDoc('故事设计文档.md', 400)) {
    process.stdout.write('\n=== design ===\n');
    const designReply = await chat(systemPrompt, [
      { role: 'user', content: `用户已确认选题《${title}》。不要再开三个候选。\n\n${clip(topicDoc, 5000)}` },
      { role: 'assistant', content: `已锁定《${title}》。下一份写故事设计。` },
      {
        role: 'user',
        content: `用户已确认选题《${title}》。

请写【故事设计】。这是恋爱攻略气质的长篇：五个可攻略女性，五根好感度，五个结局跟五个她对应。不要写成两根「城/心」，不要给路人摊条。

顺序：共同主线与结局、人物、节点表、数值状态表，最后才是故事流程图。流程图是写作目录：主线、每一次分岔、每一个汇合、每一个结局都要在图上，不要省略号。全书 6 到 8 个真正的选择点，32 到 40 个门牌，多数线性。

数值状态表必须有：这本书在玩什么、为什么是五根、每根条的起点和加减、每一个★选择的对照（改哪一个她的好感）、每个结局怎么进（通常是对应她的好感够高 + 钥匙）。每一次真正的选择必须改看得见的好感。

不要写章节卡、文风和正文。前面说几句人话，完整设计用 ===DOC:design=== 包住。`,
      },
    ], '02-design');
    designDoc = extractDoc(designReply.text, 'design') || designReply.text;
    save('故事设计文档.md', designDoc);
  }

  const designIds = extractNodeIds(flowchartOf(designDoc) || designDoc);
  process.stdout.write(`design doors: ${designIds.length}\n`);

  let chaptersDoc = readOut('章节卡.md');
  if (!hasDoc('章节卡.md', 400)) {
    process.stdout.write('\n=== chapters ===\n');
    const chaptersReply = await chat(systemPrompt, [
      { role: 'user', content: `用户已确认《${title}》的故事设计。\n\n${clip(designDoc, 7000)}` },
      { role: 'assistant', content: '设计已收下。下一份按门牌落卡。' },
      {
        role: 'user',
        content: `用户已确认《${title}》的故事设计。请写【章节卡】。

按门牌落卡，不是一章一张。先列流程图上的门牌清单，再给每一个门牌写一篇：线性拍、选择拍、每一支、汇合点、每一个结局都要有。漏一张就是错。序章第一张线性卡必须写清开头怎么钩人。选择卡的选项行写清改哪一根好感。不要写文风和正文。

前面说几句人话，完整章节卡用 ===DOC:chapters=== 包住。写不下就先写序章到第三章的全部门牌，后面再续。`,
      },
    ], '03-chapters');
    chaptersDoc = extractDoc(chaptersReply.text, 'chapters') || chaptersReply.text;
    save('章节卡.md', chaptersDoc);
  }

  for (let i = 0; i < MAX_CHAPTER_ROUNDS; i++) {
    const cardIds = extractNodeIds(chaptersDoc);
    const missing = designIds.filter((id) => !cardIds.some((c) => c.toLowerCase() === id.toLowerCase()));
    if (missing.length === 0) break;
    process.stdout.write(`\n=== chapters+ missing ${missing.length} ===\n`);
    const more = await chat(systemPrompt, [
      { role: 'user', content: `《${title}》章节卡还缺这些门牌：${missing.slice(0, 16).join('、')}。请只补这些卡，用 ===DOC:chapters+=== 包住。不要写正文。` },
    ], `03-chapters-${String(i + 1).padStart(2, '0')}`);
    const added = extractDoc(more.text, 'chapters');
    chaptersDoc = `${chaptersDoc.trim()}\n\n${(added || more.text).trim()}\n`;
    save('章节卡.md', chaptersDoc);
  }

  let styleDoc = readOut('文风.md');
  let styleName = readOut('styleName.txt').trim();
  if (!hasDoc('文风.md', 200) || !/已锁定/.test(styleDoc)) {
    process.stdout.write('\n=== style ===\n');
    const styleReply = await chat(systemPrompt, [
      { role: 'user', content: `用户已确认《${title}》的章节卡。请写【文风】。

给三到四个真正不同的写法。其中必须有一种：男性向、好读、能一口气刷——对话多、句子偏短、少抒情少解释、热度中等偏低、不要霸总和矫情内心。请推荐这一种。

每个写法都要：名字、写给谁看、手感，以及用当前这个故事的人物和场面写一段 150–250 字的小说例子。例子必须是正文。

不要写小说正文。前面说几句人话，完整文风方案用 ===DOC:style=== 包住。` },
    ], '04-style');
    styleDoc = extractDoc(styleReply.text, 'style') || styleReply.text;
    styleName = pickStyleName(styleDoc);
    process.stdout.write(`lock style: ${styleName}\n`);
    const lockReply = await chat(systemPrompt, [
      { role: 'assistant', content: styleReply.text },
      {
        role: 'user',
        content: `用户选定文风「${styleName}」。

请把【文风】文档补上「已锁定」一节：名字、那段被选中的例子原文、三句以后写正文时要守住的提醒。候选可以留着，但已锁定必须单独成节、例子必须完整保留。不要写正文。

用 ===DOC:style=== 把改完的文风文档包回来。`,
      },
    ], '04-style-lock');
    styleDoc = extractDoc(lockReply.text, 'style') || lockReply.text;
    save('文风.md', styleDoc);
    save('styleName.txt', styleName);
  }
  if (!styleName) {
    styleName = pickStyleName(styleDoc);
    save('styleName.txt', styleName);
  }

  let proseDoc = readOut('小说正文.md');
  const history = slimHistory(title, topicDoc, designDoc, chaptersDoc, styleDoc);

  if (!hasDoc('小说正文.md', 200)) {
    process.stdout.write('\n=== prose start ===\n');
    const firstId = designIds[0] || 'p01';
    const first = await chat(
      systemPrompt,
      [
        ...history,
        {
          role: 'user',
          content: withLockedStyle(
            `用户已确认章节卡和文风。请开始写【正文】。

现在是在写小说。只写写作目录上的第一场 ${firstId}，写透。这一场汉字不少于 ${MIN_SCENE_HAN}。门牌必须和流程图、章节卡一致。到不了必须表态的时刻就不要硬给选项，章末用「- 下一章 → 门牌」翻页。

正文开头写：
# ${title}
起点：${firstId}
数值：（五根好感，带起点，格式如 周洛 5 0–12；…）
事实：（钥匙的中文名）

用 Markdown。不要 JSON。不要一次把后面的支路写成提纲。

前面说几句人话，正文用 ===DOC:prose=== 包住。`,
            styleDoc,
          ),
        },
      ],
      '05-prose-start',
    );
    proseDoc = extractDoc(first.text, 'prose') || first.text;
    save('小说正文.md', proseDoc);
  }

  for (let i = 0; i < MAX_PROSE_ROUNDS; i++) {
    const han = countHan(proseDoc);
    const missing = nextMissing(designIds, proseDoc);
    const endings = proseIds(proseDoc).filter((id) => /^ending/i.test(id)).length;
    process.stdout.write(`\n=== prose ${i + 1} han ${han} missing ${missing.length} endings ${endings} ===\n`);
    writeMeta({
      title,
      styleName,
      han: {
        topic: countHan(topicDoc),
        design: countHan(designDoc),
        chapters: countHan(chaptersDoc),
        style: countHan(styleDoc),
        prose: han,
      },
      doors: { design: designIds, prose: proseIds(proseDoc) },
      missing,
    });

    if (missing.length === 0 && endings >= 3 && han >= TARGET_HAN) {
      process.stdout.write('target reached\n');
      break;
    }

    const { nodes } = splitNodes(proseDoc);
    const last = nodes[nodes.length - 1];
    let prompt;
    let draftName;

    if (missing.length > 0) {
      const nid = missing[0];
      prompt = `继续写。只写下一个未写的门牌：${nid}。

已经写过的不要重贴：${proseIds(proseDoc).join('、')}。
上一场结尾：
${clip(last?.body || '', 900)}

这一场写透，汉字不少于 ${MIN_SCENE_HAN}。若不是关键选择点，写成线性章，章末用「- 下一章 → 门牌」翻页。只有真正要表态时才给 2 个、最多 3 个做法选项，选项行必须写下记和对应那个人的好感加减，例如（记下:helped_zhou, 周洛 +2）。不要发明图上没有的节点。不要换腔。用 ===DOC:prose+=== 追加。`;
      draftName = `05-prose-${String(i + 1).padStart(2, '0')}-${nid}`;
    } else if (han < TARGET_HAN) {
      const thin = thinnestNode(proseDoc);
      if (!thin) break;
      prompt = `全书门牌已经齐，但正文只有 ${han} 汉字，目标 ${TARGET_HAN}。

请把「${thin.id} · ${thin.titleLine}」这一场按已锁定文风加厚重写。输出完整的 ## ${thin.titleLine} 一场（含原来的翻页或选项），汉字不少于 3500。不要写别的门牌。用 ===DOC:prose+=== 包住。`;
      draftName = `05-thicken-${String(i + 1).padStart(2, '0')}-${thin.id}`;
    } else {
      break;
    }

    let more;
    try {
      more = await chat(systemPrompt, [...history, { role: 'user', content: withLockedStyle(prompt, styleDoc) }], draftName);
    } catch (err) {
      process.stdout.write(`\n${draftName} failed, skip: ${err.cause?.code || err.message || err}\n`);
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    const added = (extractDoc(more.text, 'prose') || more.text).trim();

    if (missing.length === 0 && han < TARGET_HAN) {
      const extra = splitNodes(added);
      const fresh = extra.nodes[0];
      const all = splitNodes(proseDoc);
      if (fresh?.id) {
        const idx = all.nodes.findIndex((n) => n.id.toLowerCase() === fresh.id.toLowerCase());
        if (idx >= 0 && fresh.han >= all.nodes[idx].han) {
          all.nodes[idx] = fresh;
          proseDoc = joinNodes(all);
        } else {
          proseDoc = `${proseDoc.trim()}\n\n${added}\n`;
        }
      } else {
        proseDoc = `${proseDoc.trim()}\n\n${added}\n`;
      }
    } else {
      proseDoc = `${proseDoc.trim()}\n\n${added}\n`;
      const written = splitNodes(added).nodes[0];
      if (written && written.han < MIN_SCENE_HAN * 0.65 && missing[0]) {
        process.stdout.write(`thin scene ${written.id} han ${written.han}, retry\n`);
        try {
          const retry = await chat(
            systemPrompt,
            [
              ...history,
              {
                role: 'user',
                content: withLockedStyle(
                  `门牌 ${written.id} 写得太薄（${written.han} 字）。请按同一门牌重写一整场，汉字不少于 ${MIN_SCENE_HAN}。不要写别的门牌。用 ===DOC:prose+=== 包住。`,
                  styleDoc,
                ),
              },
            ],
            `${draftName}-retry`,
          );
          const retryDoc = extractDoc(retry.text, 'prose') || retry.text;
          const retryNode = splitNodes(retryDoc).nodes[0];
          if (retryNode && retryNode.han > written.han) {
            const all = splitNodes(proseDoc);
            const idx = all.nodes.findIndex((n) => n.id.toLowerCase() === retryNode.id.toLowerCase());
            if (idx >= 0) {
              all.nodes[idx] = retryNode;
              proseDoc = joinNodes(all);
            }
          }
        } catch (err) {
          process.stdout.write(`\nthin retry failed, keep short scene: ${err.message || err}\n`);
        }
      }
    }
    save('小说正文.md', proseDoc);
  }

  writeMeta({
    title,
    styleName,
    han: {
      topic: countHan(topicDoc),
      design: countHan(designDoc),
      chapters: countHan(chaptersDoc),
      style: countHan(styleDoc),
      prose: countHan(proseDoc),
    },
    doors: { design: designIds, prose: proseIds(proseDoc) },
  });
  process.stdout.write(`\nlongform saved ${OUT} title=${title} han=${countHan(proseDoc)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
