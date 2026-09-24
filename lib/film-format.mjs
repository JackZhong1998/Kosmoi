export const FILM_STRUCTURE_OPEN = '===FILM_STRUCTURE===';
export const FILM_STRUCTURE_CLOSE = '===END_FILM_STRUCTURE===';
export const ASSET_CATALOG_OPEN = '===ASSET_CATALOG===';
export const ASSET_CATALOG_CLOSE = '===END_ASSET_CATALOG===';
export const STORYBOARD_OPEN = '===STORYBOARD===';
export const STORYBOARD_CLOSE = '===END_STORYBOARD===';
export const CLIP_OPEN = '===CLIP_JOB===';
export const CLIP_CLOSE = '===END_CLIP_JOB===';

const DEFAULT_VIEWS = {
  CHAR: ['身份三视图'],
  LOOK: ['服装三视图'],
  SCENE: ['空间结构图', '四向视野'],
  PROP: ['正反面'],
  SET: ['陈设参考'],
  LIGHT: ['灯位参考'],
  DETAIL: ['特写'],
  SOUND: [],
};

export function extractBlock(text, open, close) {
  const blocks = extractAll(text, open, close);
  return blocks[0] || '';
}

export function extractAll(text, open, close) {
  const source = String(text || '');
  const out = [];
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf(open, cursor);
    if (start < 0) break;
    const from = start + open.length;
    const end = source.indexOf(close, from);
    if (end < 0) break;
    out.push(source.slice(from, end).trim());
    cursor = end + close.length;
  }
  return out;
}

export function parseJsonBlock(raw) {
  const trimmed = String(raw || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function parseFilmScript(markdown) {
  const text = String(markdown || '');
  const structureRaw = extractBlock(text, FILM_STRUCTURE_OPEN, FILM_STRUCTURE_CLOSE);
  const end = text.indexOf(FILM_STRUCTURE_CLOSE);
  const body =
    structureRaw && end >= 0 ? text.slice(end + FILM_STRUCTURE_CLOSE.length).trim() : text.trim();
  return { structureRaw, body };
}

export function splitScenes(body) {
  const parts = String(body || '').split(/\n(?=## 场[ \t])/);
  const scenes = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    const matched = text.match(/^## 场[ \t]+(\S+)/);
    scenes.push({ id: matched ? matched[1] : '', text });
  }
  return scenes;
}

function asText(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asStringList(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  const text = asText(value);
  if (!text) return [];
  return text
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAsset(row) {
  if (!row || typeof row !== 'object') return null;
  const id = asText(row.id);
  const name = asText(row.name);
  if (!id || !name) return null;
  const type = asText(row.type || 'PROP').toUpperCase();
  const views = asStringList(row.views);
  return {
    id,
    name,
    type,
    level: asText(row.level || 'B').toUpperCase(),
    state: asText(row.state || '默认'),
    parent: asText(row.parent),
    spec: asText(row.spec),
    views: views.length ? views : DEFAULT_VIEWS[type] || [],
    aliases: asStringList(row.aliases),
    imageStatus: '尚未调用',
  };
}

export function emptyCatalog() {
  return { global: [], chapters: [] };
}

export function parseAssetCatalog(markdown) {
  const blocks = extractAll(markdown, ASSET_CATALOG_OPEN, ASSET_CATALOG_CLOSE);
  const catalog = emptyCatalog();
  for (const block of blocks) {
    const data = parseJsonBlock(block);
    if (!data || typeof data !== 'object') continue;
    if (Array.isArray(data.global)) {
      for (const row of data.global) {
        const asset = normalizeAsset(row);
        if (asset) catalog.global.push(asset);
      }
    }
    if (Array.isArray(data.chapters)) {
      for (const chapter of data.chapters) absorbChapter(catalog, chapter);
    }
    if (data.sceneId || Array.isArray(data.added) || Array.isArray(data.reuse)) {
      absorbChapter(catalog, data);
    }
  }
  return catalog;
}

function absorbChapter(catalog, chapter) {
  if (!chapter || typeof chapter !== 'object') return;
  const sceneId = asText(chapter.sceneId || chapter.id);
  if (!sceneId) return;
  const added = (Array.isArray(chapter.added) ? chapter.added : []).map(normalizeAsset).filter(Boolean);
  const reuse = asStringList(chapter.reuse);
  const existing = catalog.chapters.find((item) => item.sceneId === sceneId);
  if (existing) {
    existing.reuse = [...new Set([...existing.reuse, ...reuse])];
    const seen = new Set(existing.added.map((item) => item.id));
    for (const asset of added) {
      if (seen.has(asset.id)) continue;
      existing.added.push(asset);
      seen.add(asset.id);
    }
    return;
  }
  catalog.chapters.push({ sceneId, reuse, added });
}

export function flattenAssets(catalog) {
  const list = [...(catalog?.global || [])];
  const seen = new Set(list.map((item) => item.id));
  for (const chapter of catalog?.chapters || []) {
    for (const asset of chapter.added || []) {
      if (seen.has(asset.id)) continue;
      list.push(asset);
      seen.add(asset.id);
    }
  }
  return list;
}

export function thinCatalog(catalog) {
  return flattenAssets(catalog).map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    state: asset.state,
  }));
}

function matchAsset(query, assets) {
  const name = asText(query);
  if (!name) return null;
  const exact = assets.find(
    (asset) => asset.id === name || asset.name === name || (asset.aliases || []).includes(name),
  );
  if (exact) return exact;
  if (name.length < 2) return null;
  const partial = assets.filter(
    (asset) => asset.name.length >= 2 && (asset.name.includes(name) || name.includes(asset.name)),
  );
  partial.sort((a, b) => b.name.length - a.name.length);
  return partial[0] || null;
}

export function linkShots(shots, catalog) {
  const assets = flattenAssets(catalog);
  return (Array.isArray(shots) ? shots : []).map((shot) => {
    const names = asStringList(shot?.names);
    const linked = [];
    const missing = [];
    const seen = new Set();
    for (const name of names) {
      const hit = matchAsset(name, assets);
      if (!hit) {
        missing.push(name);
        continue;
      }
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      linked.push({ id: hit.id, name: hit.name, type: hit.type });
    }
    return {
      shotId: asText(shot.shotId),
      sceneId: asText(shot.sceneId),
      path: asText(shot.path || 'trunk'),
      durationSec: Number(shot.durationSec) || 0,
      verb: asText(shot.verb),
      size: asText(shot.size),
      camera: asText(shot.camera),
      picture: asText(shot.picture),
      scene: asText(shot.scene),
      start: asText(shot.start),
      end: asText(shot.end),
      frameNote: asText(shot.frameNote),
      names,
      assets: linked,
      missing,
    };
  });
}

export function parseStoryboard(markdown) {
  const block = extractBlock(markdown, STORYBOARD_OPEN, STORYBOARD_CLOSE);
  const data = parseJsonBlock(block);
  if (!Array.isArray(data)) return [];
  return linkShots(data, emptyCatalog()).map((shot, index) => {
    const raw = data[index] || {};
    const assets = Array.isArray(raw.assets)
      ? raw.assets
          .map((item) =>
            item && typeof item === 'object'
              ? { id: asText(item.id), name: asText(item.name), type: asText(item.type) }
              : null,
          )
          .filter((item) => item && item.id)
      : shot.assets;
    const missing = Array.isArray(raw.missing) ? raw.missing.map(asText).filter(Boolean) : shot.missing;
    return { ...shot, assets, missing };
  });
}

export function parseClips(markdown) {
  return extractAll(markdown, CLIP_OPEN, CLIP_CLOSE)
    .map((block) => {
      const data = parseJsonBlock(block);
      if (!data || typeof data !== 'object') return null;
      const shotIds = asStringList(data.shotIds);
      if (!asText(data.clipId) || !shotIds.length) return null;
      const api = data.api && typeof data.api === 'object' ? data.api : {};
      const refs = Array.isArray(data.refs) ? data.refs : [];
      return {
        clipId: asText(data.clipId),
        path: asText(data.path),
        sceneId: asText(data.sceneId),
        shotIds,
        durationSec: Number(data.durationSec) || 0,
        prompt: asText(data.prompt),
        modelPrompt: asText(data.modelPrompt),
        refs: refs
          .map((item) =>
            item && typeof item === 'object'
              ? {
                  assetId: asText(item.assetId),
                  role: asText(item.role),
                  image: asText(item.image),
                }
              : null,
          )
          .filter((item) => item && item.assetId),
        api: {
          model: asText(api.model || 'seedance-2.5'),
          mode: asText(api.mode || 't2v'),
          durationSec: Number(api.durationSec || data.durationSec) || 0,
          aspect: asText(api.aspect || '16:9'),
          refAssetIds: asStringList(api.refAssetIds),
        },
        status: asText(data.status || '尚未调用'),
      };
    })
    .filter(Boolean);
}

export function buildImageJobs(catalog) {
  const jobs = [];
  for (const asset of flattenAssets(catalog)) {
    for (const view of asset.views || []) {
      jobs.push({
        id: `img-${asset.id}-${jobs.length + 1}`,
        assetId: asset.id,
        name: asset.name,
        view,
        spec: asset.spec,
        status: '尚未调用',
      });
    }
  }
  return jobs;
}

export function groupShotsByPath(shots) {
  const groups = [];
  const index = new Map();
  for (const shot of shots || []) {
    const key = `${shot.sceneId || ''}::${shot.path || ''}`;
    if (!index.has(key)) {
      const group = { sceneId: shot.sceneId || '', path: shot.path || '', shots: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).shots.push(shot);
  }
  return groups;
}

export function referencedAssets(shots, catalog) {
  const wanted = new Set();
  for (const shot of shots || []) {
    for (const asset of shot.assets || []) wanted.add(asset.id);
  }
  return flattenAssets(catalog).filter((asset) => wanted.has(asset.id));
}

export function scriptOutline(script) {
  const { structureRaw, body } = parseFilmScript(script);
  const heads = splitScenes(body).map((scene) => scene.text.split('\n').slice(0, 12).join('\n'));
  return [structureRaw ? `【压缩流程图】\n${structureRaw}` : '', heads.join('\n\n')].filter(Boolean).join('\n\n');
}
