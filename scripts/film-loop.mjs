#!/usr/bin/env node
/**
 * Multi-agent film pipeline.
 * script → assets → storyboard → link → prompts → video
 * Each agent only receives its fixed documents.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildImageJobs,
  flattenAssets,
  groupShotsByPath,
  linkShots,
  parseAssetCatalog,
  parseClips,
  parseFilmScript,
  parseStoryboard,
  referencedAssets,
  scriptOutline,
  splitScenes,
  thinCatalog,
  STORYBOARD_CLOSE,
  STORYBOARD_OPEN,
} from '../lib/film-format.mjs';

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
const OUT = path.join(root, 'output', 'film');
fs.mkdirSync(OUT, { recursive: true });

function loadAgentPrompt(name) {
  const src = fs.readFileSync(path.join(root, 'lib', 'film-agents', `${name}.ts`), 'utf8');
  const m = src.match(/export const SYSTEM_PROMPT = `([\s\S]*)`;\s*$/);
  if (!m) throw new Error(`Cannot extract SYSTEM_PROMPT from ${name}.ts`);
  return m[1];
}

function save(name, content) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}
function readOut(name) {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function countHan(text) {
  return Array.from(text).filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}
function slim(text, n) {
  if (!text) return '';
  return text.length > n ? `${text.slice(0, n)}\n\n[后文已省略，请遵守已锁定的 id 与事实]` : text;
}

function readIf(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function findStoryDir() {
  const envDir = process.env.FILM_SOURCE;
  if (envDir) return path.resolve(envDir);
  const bundled = path.join(OUT, 'input');
  if (readIf(path.join(bundled, '小说正文.md')) && readIf(path.join(bundled, '故事设计文档.md'))) return bundled;
  const stories = path.join(root, 'output', 'stories');
  if (!fs.existsSync(stories)) return bundled;
  for (const name of fs.readdirSync(stories)) {
    const dir = path.join(stories, name);
    if (readIf(path.join(dir, '小说正文.md')) && readIf(path.join(dir, '故事设计文档.md'))) return dir;
  }
  return bundled;
}

function loadStructure(dir) {
  for (const name of ['结构.json', '结构.md', 'nodeState.json']) {
    const text = readIf(path.join(dir, name));
    if (!text) continue;
    const marked = text.split('===STRUCTURE===')[1]?.split('===END_STRUCTURE===')[0];
    return (marked || text).trim();
  }
  return '';
}

function loadInputs() {
  const dir = findStoryDir();
  const design = readIf(path.join(dir, '故事设计文档.md'));
  const novel = readIf(path.join(dir, '小说正文.md'));
  const structure = loadStructure(dir);
  if (!design || !novel || !structure) {
    throw new Error(
      `剧本 Agent 需要三份固定上下文，目录 ${dir} 里缺文件。请放上 故事设计文档.md、小说正文.md、结构.json（或带 ===STRUCTURE=== 的 结构.md）。`,
    );
  }
  return { dir, design, novel, structure };
}

function legacy(name, marker) {
  const text = readOut(name);
  return Boolean(text.trim()) && !text.includes(marker);
}

function holdLegacy(name, marker) {
  if (!legacy(name, marker)) return false;
  if (process.env.FILM_REWRITE === '1') return false;
  console.log(`${name} 仍是旧稿，跳过。确认重跑请设 FILM_REWRITE=1`);
  return true;
}

async function chat(systemPrompt, messages, opts = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await chatOnce(systemPrompt, messages, opts);
    } catch (err) {
      lastErr = err;
      const connectFail =
        err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        /fetch failed|Connect Timeout|UND_ERR_CONNECT_TIMEOUT/i.test(String(err));
      if (!connectFail || attempt === 3) throw err;
      console.warn(`fetch retry ${attempt}/3: ${err.cause?.code || err.message}`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  throw lastErr;
}

async function chatOnce(systemPrompt, messages, { temperature = 0.45, draftName, timeoutMs = 18 * 60 * 1000 } = {}) {
  if (!API_KEY) throw new Error('缺少 OPENROUTER_API_KEY');
  let text = '';
  const persist = () => {
    if (draftName && text) save(draftName, text);
  };
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Spark Film Agents',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: 24576,
        stream: true,
        reasoning: { max_tokens: 512 },
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok || !res.body) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 1200)}`);
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
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            text += delta;
            if (text.length % 400 < delta.length) {
              process.stdout.write(`\rstream ${text.length} chars   `);
              persist();
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch (err) {
    persist();
    const aborted = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    if (aborted && text.length > 400) {
      process.stdout.write(`\nstream aborted after ${text.length} chars, keeping draft\n`);
      return text;
    }
    throw err;
  }
  persist();
  process.stdout.write(`\nstream done ${text.length} chars, han ${countHan(text)}\n`);
  if (!text) throw new Error('empty model output');
  return text;
}

function scriptReady(text) {
  const parsed = parseFilmScript(text);
  return parsed.structureRaw.startsWith('{') && splitScenes(parsed.body).some((scene) => scene.id);
}

async function runScript() {
  if (holdLegacy('01-剧本.md', '===FILM_STRUCTURE===')) return;
  if (scriptReady(readOut('01-剧本.md'))) {
    console.log('script exists, skip');
    return;
  }
  const inputs = loadInputs();
  console.log(`agent: script (${inputs.dir})`);
  const text = await chat(loadAgentPrompt('script'), [
    {
      role: 'user',
      content: `固定上下文只有下面三份。不要使用资产、分镜或提示词。

【故事设计】
${slim(inputs.design, 16000)}

【小说正文】
${slim(inputs.novel, 48000)}

【节点表、状态表、故事流程图】
${slim(inputs.structure, 16000)}

请压缩改编。多个章节可以合成一场。互斥分支各自成场。
选项、数值加减、结局门槛写进 ===FILM_STRUCTURE===。
每一场用「## 场 场次id」开头。`,
    },
  ]);
  save('01-剧本.md', text);
}

function catalogText() {
  return readOut('02-资产.md') || readOut('02-资产圣经.md');
}

function writeCatalog(catalog) {
  save(
    '02-资产.md',
    `# 资产库\n\n通用库先锁定文字规格。生图按 views 排队，状态是尚未调用。\n\n===ASSET_CATALOG===\n${JSON.stringify(catalog, null, 2)}\n===END_ASSET_CATALOG===\n`,
  );
}

async function runAssets() {
  if (holdLegacy('02-资产.md', '===ASSET_CATALOG===') || holdLegacy('02-资产圣经.md', '===ASSET_CATALOG===')) return;
  const script = readOut('01-剧本.md');
  if (!scriptReady(script)) throw new Error('缺带压缩流程图的 01-剧本.md');
  const inputs = loadInputs();
  const scenes = splitScenes(parseFilmScript(script).body).filter((scene) => scene.id);
  let catalog = parseAssetCatalog(catalogText());
  if (!catalog.global.length) {
    console.log('agent: assets global');
    const text = await chat(
      loadAgentPrompt('assets'),
      [
        {
          role: 'user',
          content: `这一遍只建通用库。上下文是故事设计和剧本大纲，没有小说原文。

【故事设计】
${slim(inputs.design, 12000)}

【剧本大纲】
${slim(scriptOutline(script), 12000)}

角色脸、每套服装、场景空间分开。同一物不同状态分条。
只输出 ===ASSET_CATALOG=== ，chapters 用空数组。不要英文 Prompt。`,
        },
      ],
      { temperature: 0.35, draftName: '_draft-02-global.md' },
    );
    catalog = parseAssetCatalog(text);
    if (!catalog.global.length) throw new Error('通用资产库没有解析出条目');
    writeCatalog(catalog);
  }

  for (const scene of scenes) {
    if (catalog.chapters.some((chapter) => chapter.sceneId === scene.id)) {
      console.log(`assets ${scene.id} exists, skip`);
      continue;
    }
    console.log(`agent: assets ${scene.id}`);
    const text = await chat(
      loadAgentPrompt('assets'),
      [
        {
          role: 'user',
          content: `这一遍只处理场次 ${scene.id}。不要改通用库规格。

【本场剧本】
${scene.text}

【通用库薄目录】
${JSON.stringify(thinCatalog({ global: catalog.global, chapters: [] }))}

输出 ===ASSET_CATALOG=== ，对象含 sceneId、reuse、added。
reuse 只能引用薄目录里的 id。新增的写完整规格。不要英文 Prompt。`,
        },
      ],
      { temperature: 0.35, draftName: `_draft-02-${scene.id}.md` },
    );
    const patch = parseAssetCatalog(text);
    const chapter = patch.chapters.find((item) => item.sceneId === scene.id) || patch.chapters[0];
    if (!chapter) throw new Error(`场次 ${scene.id} 没有解析出复用或新增`);
    catalog.chapters.push({ ...chapter, sceneId: scene.id });
    writeCatalog(catalog);
  }
}

function writeBoard(shots) {
  save(
    '03-分镜.md',
    `# 分镜表\n\n一行一个连续镜头。资产列由薄目录挂接。\n\n${STORYBOARD_OPEN}\n${JSON.stringify(shots, null, 2)}\n${STORYBOARD_CLOSE}\n`,
  );
}

async function runStoryboard() {
  if (holdLegacy('03-分镜.md', '===STORYBOARD===')) return;
  const script = readOut('01-剧本.md');
  const catalog = parseAssetCatalog(catalogText());
  if (!scriptReady(script) || !catalog.global.length) throw new Error('缺剧本或通用资产库');
  const scenes = splitScenes(parseFilmScript(script).body).filter((scene) => scene.id);
  let shots = parseStoryboard(readOut('03-分镜.md')).filter((shot) => shot.shotId);
  for (const scene of scenes) {
    if (shots.some((shot) => shot.sceneId === scene.id)) {
      console.log(`storyboard ${scene.id} exists, skip`);
      continue;
    }
    console.log(`agent: storyboard ${scene.id}`);
    const text = await chat(
      loadAgentPrompt('storyboard'),
      [
        {
          role: 'user',
          content: `只根据这场剧本写分镜。不要资产 id，可见物写进 names。

${scene.text}

输出 ===STORYBOARD=== JSON 数组。sceneId 用 ${scene.id}。互斥分支用不同 path。`,
        },
      ],
      { temperature: 0.48, draftName: `_draft-03-${scene.id}.md` },
    );
    const parsed = parseStoryboard(text).filter((shot) => shot.shotId);
    if (!parsed.length) throw new Error(`场次 ${scene.id} 没有镜头`);
    shots = shots.concat(parsed.map((shot) => ({ ...shot, sceneId: shot.sceneId || scene.id })));
    writeBoard(linkShots(shots, catalog));
    shots = parseStoryboard(readOut('03-分镜.md'));
  }
  writeBoard(linkShots(shots, catalog));
}

function clipsCover(shots, clips) {
  const wanted = new Set(shots.map((shot) => shot.shotId));
  const seen = new Set();
  for (const clip of clips) {
    if ((clip.durationSec || 0) > 15 && (clip.shotIds || []).length > 1) return false;
    const paths = new Set(clip.shotIds.map((id) => shots.find((shot) => shot.shotId === id)?.path).filter(Boolean));
    if (paths.size > 1) return false;
    for (const id of clip.shotIds) {
      if (seen.has(id)) return false;
      seen.add(id);
    }
  }
  for (const id of wanted) if (!seen.has(id)) return false;
  return wanted.size > 0;
}

async function runPrompts() {
  if (holdLegacy('04-提示词.md', '===CLIP_JOB===')) return;
  const catalog = parseAssetCatalog(catalogText());
  const shots = linkShots(parseStoryboard(readOut('03-分镜.md')), catalog).filter((shot) => shot.shotId);
  if (!shots.length) throw new Error('缺分镜表');
  let clips = parseClips(readOut('04-提示词.md'));
  let text = readOut('04-提示词.md');
  for (const group of groupShotsByPath(shots)) {
    const covered = new Set(clips.flatMap((clip) => clip.shotIds));
    if (group.shots.every((shot) => covered.has(shot.shotId))) {
      console.log(`prompts ${group.path} exists, skip`);
      continue;
    }
    console.log(`agent: prompts ${group.sceneId} ${group.path}`);
    const named = referencedAssets(group.shots, catalog);
    const more = await chat(
      loadAgentPrompt('prompts'),
      [
        {
          role: 'user',
          content: `把下面同一条路径上的镜头编成若干段，每段不超过 15 秒。不要并入其他路径。
只使用点名的资产。每一个 shotId 恰好出现一次。

【镜头】
${JSON.stringify(group.shots)}

【这些镜头点名的资产】
${JSON.stringify(named.map((asset) => ({ id: asset.id, name: asset.name, type: asset.type, state: asset.state, spec: asset.spec, views: asset.views })))}

每个片段一个 ===CLIP_JOB===。status 写尚未调用。`,
        },
      ],
      { temperature: 0.28, draftName: `_draft-04-${group.sceneId}-${group.path}.md` },
    );
    text = `${text.trim()}\n\n${more}`.trim();
    save('04-提示词.md', text);
    clips = parseClips(text);
  }
  if (!clipsCover(shots, clips)) console.log('prompts 尚未覆盖全部分镜，或有片段混了路径');
}

async function runVideo() {
  if (holdLegacy('05-视频任务单.md', 'CLIP-')) return;
  if (readOut('05-视频任务单.md').includes('CLIP-')) {
    console.log('video exists, skip');
    return;
  }
  const catalog = parseAssetCatalog(catalogText());
  const shots = parseStoryboard(readOut('03-分镜.md'));
  const clips = parseClips(readOut('04-提示词.md'));
  if (!clips.length) throw new Error('缺片段提示词');
  const images = buildImageJobs(catalog).filter((job) => clips.some((clip) => clip.api.refAssetIds.includes(job.assetId) || clip.refs.some((ref) => ref.assetId === job.assetId)));
  console.log('agent: video');
  const text = await chat(
    loadAgentPrompt('video'),
    [
      {
        role: 'user',
        content: `只调度下面已经编好的片段。不要改 prompt，不要改镜头。

【需先完成的静帧】
${images.map((job) => `${job.id} ${job.name} ${job.view} ${job.status}`).join('\n') || '无'}

【片段】
${clips.map((clip) => `${clip.clipId} path=${clip.path} ${clip.durationSec}s shots=${clip.shotIds.join(',')} refs=${clip.api.refAssetIds.join(',') || '无'} status=${clip.status}`).join('\n')}

【镜头目录】
${shots.map((shot) => `${shot.shotId} ${shot.path} ${shot.verb}`).join('\n')}

状态一律尚未调用。先静帧，再按 CLIP 提交。不同 path 不要串成一条。`,
      },
    ],
    { temperature: 0.25, draftName: '_draft-05-视频任务单.md' },
  );
  save('05-视频任务单.md', text);
}

function score() {
  const script = readOut('01-剧本.md');
  const assets = catalogText();
  const board = readOut('03-分镜.md');
  const prompts = readOut('04-提示词.md');
  const video = readOut('05-视频任务单.md');
  if (script && !script.includes('===FILM_STRUCTURE===')) {
    const report = `# 五 Agent 拆分评测\n\n模型：${MODEL}\n\n当前 output/film 仍是旧稿（镜头卡 / 一镜一条）。新合同尚未重跑。确认覆盖请设 FILM_REWRITE=1。\n`;
    save('评测.md', report);
    console.log(report);
    return;
  }
  const catalog = parseAssetCatalog(assets);
  const shots = linkShots(parseStoryboard(board), catalog).filter((shot) => shot.shotId);
  const clips = parseClips(prompts);
  const checks = [
    ['script_structure', scriptReady(script), '压缩流程图和场次'],
    ['assets_global', catalog.global.length > 0 && !/===ASSET_JOB===/.test(assets), `通用资产 ${catalog.global.length}`],
    ['assets_views', flattenAssets(catalog).some((asset) => asset.views.some((view) => /三视图|空间|四向|正反/.test(view))), '三视图或空间图规格'],
    ['board_rows', shots.length > 0 && !/===SHOT_JOB===/.test(board), `镜头 ${shots.length}`],
    ['board_linked', shots.every((shot) => shot.assets.length || shot.missing.length || !shot.names.length), '资产列已挂接或标了缺失'],
    ['clips', clipsCover(shots, clips), `片段 ${clips.length}`],
    ['video_sheet', /尚未调用/.test(video) && /CLIP-/.test(video), '视频任务单'],
  ];
  const passed = checks.filter((item) => item[1]).length;
  const report = `# 五 Agent 拆分评测

模型：${MODEL}
通过：${passed} / ${checks.length}

| 项 | 结果 | 说明 |
|---|---|---|
${checks.map((item) => `| ${item[0]} | ${item[1] ? '通过' : '失败'} | ${item[2]} |`).join('\n')}

剧本 Agent 只吃设计、小说和结构。资产 Agent 只吃设计和剧本。分镜只吃当场剧本。提示词只吃镜头和点名资产。
`;
  save('评测.md', report);
  console.log(report);
}

const step = process.argv[2] || 'all';
const order = {
  script: [runScript],
  assets: [runAssets],
  storyboard: [runStoryboard],
  prompts: [runPrompts],
  video: [runVideo],
  all: [runScript, runAssets, runStoryboard, runPrompts, runVideo],
};

if (step === 'score') {
  score();
  process.exit(0);
}
const fns = order[step];
if (!fns) {
  console.log('usage: node scripts/film-loop.mjs script|assets|storyboard|prompts|video|all|score');
  process.exit(1);
}
for (const fn of fns) await fn();
score();
console.log('film agents finished');
