import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const filmDir = path.join(process.cwd(), 'output', 'film');
  const read = async (name: string) => {
    try {
      return await fs.readFile(path.join(filmDir, name), 'utf8');
    } catch {
      return '';
    }
  };
  const [script, assetsBible, assetsFile, board, prompts, video] = await Promise.all([
    read('01-剧本.md'),
    read('02-资产圣经.md'),
    read('02-资产.md'),
    read('03-分镜.md'),
    read('04-提示词.md'),
    read('05-视频任务单.md'),
  ]);
  const prefer = (marker: string, ...texts: string[]) =>
    texts.find((text) => text.includes(marker)) || texts.find((text) => text.trim()) || '';
  return Response.json({
    film: {
      script: prefer('===FILM_STRUCTURE===', script),
      assets: prefer('===ASSET_CATALOG===', assetsFile, assetsBible),
      board: prefer('===STORYBOARD===', board),
      prompts: prefer('===CLIP_JOB===', prompts),
      video,
      eval: '',
    },
  });
}
