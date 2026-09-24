export const FILM_STRUCTURE_OPEN: string;
export const FILM_STRUCTURE_CLOSE: string;
export const ASSET_CATALOG_OPEN: string;
export const ASSET_CATALOG_CLOSE: string;
export const STORYBOARD_OPEN: string;
export const STORYBOARD_CLOSE: string;
export const CLIP_OPEN: string;
export const CLIP_CLOSE: string;

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

export function extractBlock(text: string, open: string, close: string): string;
export function extractAll(text: string, open: string, close: string): string[];
export function parseJsonBlock(raw: string): unknown;
export function parseFilmScript(markdown: string): { structureRaw: string; body: string };
export function splitScenes(body: string): SceneSlice[];
export function normalizeAsset(row: unknown): AssetRecord | null;
export function emptyCatalog(): AssetCatalog;
export function parseAssetCatalog(markdown: string): AssetCatalog;
export function flattenAssets(catalog: AssetCatalog): AssetRecord[];
export function thinCatalog(catalog: AssetCatalog): { id: string; name: string; type: string; state: string }[];
export function linkShots(shots: unknown[], catalog: AssetCatalog): StoryboardShot[];
export function parseStoryboard(markdown: string): StoryboardShot[];
export function parseClips(markdown: string): ClipJob[];
export function buildImageJobs(catalog: AssetCatalog): ImageJob[];
export function groupShotsByPath(shots: StoryboardShot[]): { sceneId: string; path: string; shots: StoryboardShot[] }[];
export function referencedAssets(shots: StoryboardShot[], catalog: AssetCatalog): AssetRecord[];
export function scriptOutline(script: string): string;
