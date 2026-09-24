'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StoryStructurePanel } from '@/components/StoryStructure';
import {
  buildImageJobs,
  groupShotsByPath,
  linkShots,
  parseAssetCatalog,
  parseClips,
  parseFilmScript,
  parseStoryboard,
  splitScenes,
  type AssetRecord,
  type ClipJob,
  type StoryboardShot,
} from '@/lib/film-format';
import { parseStructure } from '@/lib/structure';

type FilmTab = 'script' | 'assets' | 'board';

const TABS: { id: FilmTab; label: string }[] = [
  { id: 'script', label: '剧本' },
  { id: 'assets', label: '资产库' },
  { id: 'board', label: '分镜与提示词' },
];

export function FilmStudio() {
  const [tab, setTab] = useState<FilmTab>('script');
  const [docs, setDocs] = useState({ script: '', assets: '', board: '', prompts: '', video: '' });
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const remote = await fetch('/api/load').then((response) => response.json());
        setDocs({
          script: remote.film?.script || '',
          assets: remote.film?.assets || '',
          board: remote.film?.board || '',
          prompts: remote.film?.prompts || '',
          video: remote.film?.video || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '无法读取影视制作包');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const script = useMemo(() => parseFilmScript(docs.script), [docs.script]);
  const structure = useMemo(() => (script.structureRaw ? parseStructure(script.structureRaw) : null), [script.structureRaw]);
  const scenes = useMemo(() => splitScenes(script.body), [script.body]);
  const catalog = useMemo(() => parseAssetCatalog(docs.assets), [docs.assets]);
  const imageJobs = useMemo(() => buildImageJobs(catalog), [catalog]);
  const shots = useMemo(() => linkShots(parseStoryboard(docs.board), catalog).filter((shot) => shot.shotId), [docs.board, catalog]);
  const clips = useMemo(() => parseClips(docs.prompts), [docs.prompts]);

  const openScene = (id: string) => {
    setActiveId(id);
    document.getElementById(`film-scene-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <b>火花创作 Studio</b>
          <span>互动影视</span>
        </div>
        <div className="topbar-meta">
          <span>
            场 <em>{scenes.filter((scene) => scene.id).length}</em>
          </span>
          <span>
            资产 <em>{catalog.global.length + catalog.chapters.reduce((sum, chapter) => sum + chapter.added.length, 0)}</em>
          </span>
          <span>
            镜头 <em>{shots.length}</em>
          </span>
          <span>
            片段 <em>{clips.length}</em>
          </span>
          <Link className="ghost" href="/me">
            回我的
          </Link>
        </div>
      </header>
      <div className="workspace film-workspace">
        <section className="right film-main">
          <div className="pane-head">
            <div className="tabs">
              {TABS.map((item) => (
                <button key={item.id} className={`tab${tab === item.id ? ' active' : ''}`} onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <p>
              {tab === 'script'
                ? '左侧是压缩后的流程，右侧是剧本正文。'
                : tab === 'assets'
                  ? '先通用库，再看每一场复用了什么、新加了什么。'
                  : '一行一个镜头。右侧是这一镜用到的资产。同一条路径收成约 15 秒一段。'}
            </p>
          </div>
          {error ? <p className="status-line error">{error}</p> : null}
          {!ready ? <div className="doc-body" /> : null}
          {ready && tab === 'script' ? (
            <ScriptPane
              body={script.body}
              scenes={scenes}
              structure={structure}
              structureRaw={script.structureRaw}
              activeId={activeId}
              onOpen={openScene}
            />
          ) : null}
          {ready && tab === 'assets' ? <AssetPane raw={docs.assets} catalog={catalog} jobs={imageJobs} /> : null}
          {ready && tab === 'board' ? (
            <BoardPane shots={shots} clips={clips} boardRaw={docs.board} promptsRaw={docs.prompts} video={docs.video} />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ScriptPane({
  body,
  scenes,
  structure,
  structureRaw,
  activeId,
  onOpen,
}: {
  body: string;
  scenes: { id: string; text: string }[];
  structure: ReturnType<typeof parseStructure>;
  structureRaw: string;
  activeId: string;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="film-script">
      <aside className="film-script-map">
        <StoryStructurePanel
          data={structure}
          activeId={activeId}
          onOpen={onOpen}
          hint="压缩后的剧本流程。选项、数值和结局留在这里。"
          error={structureRaw && !structure ? '流程图没有解析出来。' : ''}
        />
        {!structureRaw ? <p className="film-map-note">这份剧本还没有压缩流程图。重跑剧本 Agent 后，左侧会和小说台一样排开场次。</p> : null}
      </aside>
      <div className="doc-body">
        {body ? (
          <div className="doc-paper">
            {scenes.map((scene, index) => (
              <section id={scene.id ? `film-scene-${scene.id}` : undefined} key={`${scene.id}-${index}`}>
                <Markdown remarkPlugins={[remarkGfm]}>{scene.text}</Markdown>
              </section>
            ))}
          </div>
        ) : (
          <EmptyFilm
            title="还没有互动剧本"
            detail="剧本 Agent 只读故事设计、小说正文、节点表、状态表和流程图。多个章节可以合成一场。"
          />
        )}
      </div>
    </div>
  );
}

function AssetPane({
  raw,
  catalog,
  jobs,
}: {
  raw: string;
  catalog: ReturnType<typeof parseAssetCatalog>;
  jobs: ReturnType<typeof buildImageJobs>;
}) {
  const hasLibrary = catalog.global.length > 0 || catalog.chapters.length > 0;
  if (!hasLibrary) {
    return (
      <div className="doc-body">
        {raw ? (
          <div className="doc-paper wide">
            <Markdown remarkPlugins={[remarkGfm]}>{raw}</Markdown>
          </div>
        ) : (
          <EmptyFilm title="还没有资产库" detail="资产 Agent 只读故事设计和剧本。先写通用的脸、服装和空间，再按场标出复用和新增。" />
        )}
      </div>
    );
  }
  return (
    <div className="film-assets">
      <section>
        <h2>通用库</h2>
        <p className="film-lead">文字规格先锁定。三视图和空间图尚未调用生图。</p>
        <div className="film-asset-list">
          {catalog.global.map((asset) => (
            <AssetCard key={asset.id} asset={asset} jobs={jobs} />
          ))}
        </div>
      </section>
      <section>
        <h2>分章关联</h2>
        {catalog.chapters.length === 0 ? <p className="film-lead">还没有按场标出复用和新增。</p> : null}
        {catalog.chapters.map((chapter) => (
          <div className="film-chapter" key={chapter.sceneId}>
            <h3>场 {chapter.sceneId}</h3>
            <p>
              复用{' '}
              {chapter.reuse.length
                ? chapter.reuse.map((id) => {
                    const known = [...catalog.global, ...catalog.chapters.flatMap((item) => item.added)].find((asset) => asset.id === id);
                    return (
                      <em key={id}>
                        {known?.name || id}
                      </em>
                    );
                  })
                : '无'}
            </p>
            {chapter.added.length ? (
              <div className="film-asset-list">
                {chapter.added.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} jobs={jobs} fresh />
                ))}
              </div>
            ) : (
              <p className="film-lead">这一场没有新增资产。</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function AssetCard({ asset, jobs, fresh = false }: { asset: AssetRecord; jobs: ReturnType<typeof buildImageJobs>; fresh?: boolean }) {
  const views = jobs.filter((job) => job.assetId === asset.id);
  return (
    <article className="film-asset-card">
      <div className="film-views">
        {views.length ? (
          views.map((job) => (
            <div className="film-view" key={job.id}>
              <b>{job.view}</b>
              <span>{job.status}</span>
            </div>
          ))
        ) : (
          <div className="film-view">
            <b>声音</b>
            <span>不生图</span>
          </div>
        )}
      </div>
      <div>
        <h3>
          {asset.name}
          {fresh ? <i>本场新增</i> : null}
        </h3>
        <p>
          {asset.id} · {asset.type} · {asset.level} · {asset.state}
          {asset.parent ? ` · 属于 ${asset.parent}` : ''}
        </p>
        <p>{asset.spec}</p>
      </div>
    </article>
  );
}

function BoardPane({
  shots,
  clips,
  boardRaw,
  promptsRaw,
  video,
}: {
  shots: StoryboardShot[];
  clips: ClipJob[];
  boardRaw: string;
  promptsRaw: string;
  video: string;
}) {
  if (!shots.length) {
    return (
      <div className="doc-body">
        {boardRaw || promptsRaw ? (
          <div className="doc-paper wide">
            {boardRaw ? <Markdown remarkPlugins={[remarkGfm]}>{boardRaw}</Markdown> : null}
            {promptsRaw ? <Markdown remarkPlugins={[remarkGfm]}>{promptsRaw}</Markdown> : null}
          </div>
        ) : (
          <EmptyFilm
            title="还没有分镜表"
            detail="分镜 Agent 只读这一场剧本。镜头写完后，薄目录把资产名挂到右侧，提示词 Agent 再把同一条路径收成约 15 秒一段。"
          />
        )}
      </div>
    );
  }

  const used = new Set<string>();
  const groups = clips.map((clip) => {
    const rows = clip.shotIds.map((id) => shots.find((shot) => shot.shotId === id)).filter((shot): shot is StoryboardShot => Boolean(shot));
    rows.forEach((shot) => used.add(shot.shotId));
    return { clip, rows };
  });
  const loose = shots.filter((shot) => !used.has(shot.shotId));
  const looseGroups = groupShotsByPath(loose);

  return (
    <div className="film-board-wrap">
      {groups.map(({ clip, rows }) => (
        <ClipBlock key={clip.clipId} clip={clip} rows={rows} />
      ))}
      {looseGroups.map((group) => (
        <section className="film-clip" key={`loose-${group.sceneId}-${group.path}`}>
          <header className="film-clip-head">
            <b>
              {group.sceneId || '未分场'} · {group.path || '未标路径'}
            </b>
            <span>还没编成 15 秒片段</span>
          </header>
          <ShotTable rows={group.shots} />
        </section>
      ))}
      {video ? (
        <details className="film-video-note">
          <summary>视频调度</summary>
          <div className="doc-paper wide">
            <Markdown remarkPlugins={[remarkGfm]}>{video}</Markdown>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function ClipBlock({ clip, rows }: { clip: ClipJob; rows: StoryboardShot[] }) {
  return (
    <article className="film-clip">
      <header className="film-clip-head">
        <b>{clip.clipId}</b>
        <span>{clip.path}</span>
        <span>{clip.durationSec} 秒</span>
        <span>{clip.api.model}</span>
        <span>{clip.api.mode}</span>
        <span>{clip.api.aspect}</span>
        <span>{clip.status}</span>
      </header>
      <ShotTable rows={rows} />
      <footer className="film-clip-prompt">
        <p>{clip.prompt}</p>
        <p className="film-api">
          参考图 {clip.api.refAssetIds.length ? clip.api.refAssetIds.join('、') : '无'}
          {clip.refs.length
            ? ` · ${clip.refs.map((ref) => `${ref.assetId}（${ref.role}${ref.image ? '，已有图' : '，图未生成'}）`).join('、')}`
            : ''}
        </p>
      </footer>
    </article>
  );
}

function ShotTable({ rows }: { rows: StoryboardShot[] }) {
  if (!rows.length) return <p className="film-lead">这一段还没有对上镜头行。</p>;
  return (
    <div className="film-table-scroll">
      <table className="film-table">
        <thead>
          <tr>
            <th>镜头</th>
            <th>戏剧</th>
            <th>景别</th>
            <th>运镜</th>
            <th>画面</th>
            <th>场景</th>
            <th>起止</th>
            <th>分镜示意</th>
            <th>资产</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((shot) => (
            <tr key={shot.shotId}>
              <td>
                {shot.shotId}
                <small>
                  {shot.durationSec ? `${shot.durationSec} 秒` : ''} {shot.path}
                </small>
              </td>
              <td>{shot.verb}</td>
              <td>{shot.size}</td>
              <td>{shot.camera}</td>
              <td>{shot.picture}</td>
              <td>{shot.scene}</td>
              <td>
                {shot.start}
                {shot.end ? ` → ${shot.end}` : ''}
              </td>
              <td>{shot.frameNote}</td>
              <td className="assets">
                {shot.assets.map((asset) => (
                  <em key={asset.id}>
                    {asset.name}
                    <small>{asset.id}</small>
                  </em>
                ))}
                {shot.missing.map((name) => (
                  <em className="missing" key={name}>
                    {name}
                    <small>缺失</small>
                  </em>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyFilm({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="placeholder">
      <p>{title}</p>
      <p>{detail}</p>
    </div>
  );
}
