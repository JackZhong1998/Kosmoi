import {
  buildImageJobs as buildImageJobsRaw,
  emptyCatalog as emptyCatalogRaw,
  extractAll as extractAllRaw,
  extractBlock as extractBlockRaw,
  flattenAssets as flattenAssetsRaw,
  groupShotsByPath as groupShotsByPathRaw,
  linkShots as linkShotsRaw,
  normalizeAsset as normalizeAssetRaw,
  parseAssetCatalog as parseAssetCatalogRaw,
  parseClips as parseClipsRaw,
  parseFilmScript as parseFilmScriptRaw,
  parseJsonBlock as parseJsonBlockRaw,
  parseStoryboard as parseStoryboardRaw,
  referencedAssets as referencedAssetsRaw,
  scriptOutline as scriptOutlineRaw,
  splitScenes as splitScenesRaw,
  thinCatalog as thinCatalogRaw,
  ASSET_CATALOG_CLOSE,
  ASSET_CATALOG_OPEN,
  CLIP_CLOSE,
  CLIP_OPEN,
  FILM_STRUCTURE_CLOSE,
  FILM_STRUCTURE_OPEN,
  STORYBOARD_CLOSE,
  STORYBOARD_OPEN,
} from './film-format.mjs';

export {
  ASSET_CATALOG_CLOSE,
  ASSET_CATALOG_OPEN,
  CLIP_CLOSE,
  CLIP_OPEN,
  FILM_STRUCTURE_CLOSE,
  FILM_STRUCTURE_OPEN,
  STORYBOARD_CLOSE,
  STORYBOARD_OPEN,
};

export type AssetRecord = {
  id: string;
  name: string;
  type: string;
  level: string;
  state: string;
  parent: string;
  spec: string;
  views: string[];
  aliases: string[];
  imageStatus: string;
};

export type AssetChapter = {
  sceneId: string;
  reuse: string[];
  added: AssetRecord[];
};

export type AssetCatalog = {
  global: AssetRecord[];
  chapters: AssetChapter[];
};

export type ShotAssetRef = { id: string; name: string; type: string };

export type StoryboardShot = {
  shotId: string;
  sceneId: string;
  path: string;
  durationSec: number;
  verb: string;
  size: string;
  camera: string;
  picture: string;
  scene: string;
  start: string;
  end: string;
  frameNote: string;
  names: string[];
  assets: ShotAssetRef[];
  missing: string[];
};

export type ClipRef = { assetId: string; role: string; image: string };

export type ClipJob = {
  clipId: string;
  path: string;
  sceneId: string;
  shotIds: string[];
  durationSec: number;
  prompt: string;
  modelPrompt: string;
  refs: ClipRef[];
  api: {
    model: string;
    mode: string;
    durationSec: number;
    aspect: string;
    refAssetIds: string[];
  };
  status: string;
};

export type ImageJob = {
  id: string;
  assetId: string;
  name: string;
  view: string;
  spec: string;
  status: string;
};

export type SceneSlice = { id: string; text: string };
export type ThinAsset = { id: string; name: string; type: string; state: string };
export type PathGroup = { sceneId: string; path: string; shots: StoryboardShot[] };

export function extractBlock(text: string, open: string, close: string) {
  return extractBlockRaw(text, open, close) as string;
}
export function extractAll(text: string, open: string, close: string) {
  return extractAllRaw(text, open, close) as string[];
}
export function parseJsonBlock(raw: string) {
  return parseJsonBlockRaw(raw) as unknown;
}
export function parseFilmScript(markdown: string) {
  return parseFilmScriptRaw(markdown) as { structureRaw: string; body: string };
}
export function splitScenes(body: string) {
  return splitScenesRaw(body) as SceneSlice[];
}
export function normalizeAsset(row: unknown) {
  return normalizeAssetRaw(row) as AssetRecord | null;
}
export function emptyCatalog() {
  return emptyCatalogRaw() as AssetCatalog;
}
export function parseAssetCatalog(markdown: string) {
  return parseAssetCatalogRaw(markdown) as AssetCatalog;
}
export function flattenAssets(catalog: AssetCatalog) {
  return flattenAssetsRaw(catalog) as AssetRecord[];
}
export function thinCatalog(catalog: AssetCatalog) {
  return thinCatalogRaw(catalog) as ThinAsset[];
}
export function linkShots(shots: unknown[], catalog: AssetCatalog) {
  return linkShotsRaw(shots, catalog) as StoryboardShot[];
}
export function parseStoryboard(markdown: string) {
  return parseStoryboardRaw(markdown) as StoryboardShot[];
}
export function parseClips(markdown: string) {
  return parseClipsRaw(markdown) as ClipJob[];
}
export function buildImageJobs(catalog: AssetCatalog) {
  return buildImageJobsRaw(catalog) as ImageJob[];
}
export function groupShotsByPath(shots: StoryboardShot[]) {
  return groupShotsByPathRaw(shots) as PathGroup[];
}
export function referencedAssets(shots: StoryboardShot[], catalog: AssetCatalog) {
  return referencedAssetsRaw(shots, catalog) as AssetRecord[];
}
export function scriptOutline(script: string) {
  return scriptOutlineRaw(script) as string;
}
