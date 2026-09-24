'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyChoice,
  buildStoryFlow,
  choiceAvailable,
  factLabel,
  flowKindMark,
  initialStats,
  isPageTurnText,
  renderBody,
  resolveNodeId,
  type FlowRow,
} from '@/lib/parse-story';
import { loadProgressAsync, rememberRead, type PlaySnapshot } from '@/lib/reading-history';
import { layoutFlowPieces, type FlowNode, type FlowTree, type StoryStructure } from '@/lib/structure';
import type { StoryChoice, StoryData, StoryMeta } from '@/lib/types';
import { useLocale } from '@/components/LocaleProvider';

const FLOW_KIND: Record<FlowNode['kind'], string> = {
  linear: '',
  choice: '★',
  branch: '',
  merge: '汇',
  ending: '结',
};

function flowchartOrder(structure: StoryStructure): string[] {
  const byId = new Map(structure.flowchart.map((item) => [item.id, item]));
  const incoming = new Set<string>();
  for (const item of structure.flowchart) {
    for (const id of item.next) if (byId.has(id)) incoming.add(id);
  }
  const root = structure.flowchart.find((item) => !incoming.has(item.id)) || structure.flowchart[0];
  const order: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (!id || seen.has(id) || !byId.has(id)) return;
    seen.add(id);
    order.push(id);
    for (const next of byId.get(id)!.next) visit(next);
  };
  if (root) visit(root.id);
  for (const item of structure.flowchart) if (!seen.has(item.id)) order.push(item.id);
  return order;
}

/** 这一场正文没写「下一章 →」时，用流程图上的下一节点接着读或接着写。 */
function nextChapterIds(structure: StoryStructure | null | undefined, nodeId: string, title: string): string[] {
  if (!structure?.flowchart.length) return [];
  const flow = structure.flowchart.find((item) => item.id === nodeId || item.id === title);
  if (flow?.kind === 'ending') return [];
  if (flow?.next.length) return flow.next.filter((id) => id && id !== flow.id);
  const order = flowchartOrder(structure);
  const index = order.findIndex((id) => id === nodeId || id === title);
  const after = index >= 0 ? order[index + 1] : '';
  return after ? [after] : [];
}

export type MissingWriteRequest = {
  fromId: string;
  fromTitle: string;
  choice: StoryChoice;
};

type PendingWrite = {
  fromId: string;
  choice: StoryChoice;
};

type Snapshot = PlaySnapshot;

type LastDelta = {
  stats: { id: string; name: string; from: number; to: number; delta: number }[];
  facts: string[];
};

function describeDelta(
  prevStats: Record<string, number>,
  nextStats: Record<string, number>,
  prevFacts: string[],
  nextFacts: string[],
  meta: StoryMeta | null,
): LastDelta {
  const stats: LastDelta['stats'] = [];
  for (const def of (meta?.stats ?? []).filter((s) => s.visible)) {
    const from = prevStats[def.id] ?? def.initial;
    const to = nextStats[def.id] ?? def.initial;
    if (from === to) continue;
    stats.push({ id: def.id, name: def.name, from, to, delta: to - from });
  }
  const prev = new Set(prevFacts);
  const facts = nextFacts.filter((id) => !prev.has(id)).map((id) => factLabel(id, meta));
  return { stats, facts };
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function groupFlow(rows: FlowRow[]) {
  const groups: Array<
    | { type: 'chapter'; chapter: string }
    | { type: 'arrow'; depth: number }
    | { type: 'chain'; item: Extract<FlowRow, { type: 'node' }> }
    | { type: 'fork'; items: Extract<FlowRow, { type: 'node' }>[] }
  > = [];
  for (const row of rows) {
    if (row.type === 'chapter' || row.type === 'arrow') {
      groups.push(row);
      continue;
    }
    const branched = row.connector === 'branch' || row.connector === 'branch-last';
    const last = groups[groups.length - 1];
    if (branched && last && last.type === 'fork' && last.items[0]?.depth === row.depth) {
      last.items.push(row);
      continue;
    }
    if (branched) {
      groups.push({ type: 'fork', items: [row] });
      continue;
    }
    groups.push({ type: 'chain', item: row });
  }
  return groups;
}

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconList({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {open ? (
        <path
          d="M7 6h14M7 12h14M7 18h10M4 6.5v.01M4 12v.01M4 17.5v.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function IconStats() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 18V10M12 18V6M18 18v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Reader({
  story,
  structure = null,
  storyId,
  onRestartRequest,
  onBack,
  backLabel = '返回首页',
  onProgress,
  onWriteMissing,
  writing = false,
  writeError = '',
  defaultTocOpen = true,
  authorPreview = false,
  title,
}: {
  story: StoryData;
  structure?: StoryStructure | null;
  storyId?: string;
  onRestartRequest?: () => void;
  onBack?: () => void;
  backLabel?: string;
  onProgress?: (info: { title: string; chapter: string }) => void;
  onWriteMissing?: (request: MissingWriteRequest) => void;
  writing?: boolean;
  writeError?: string;
  defaultTocOpen?: boolean;
  authorPreview?: boolean;
  title?: string;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const actualBackLabel = backLabel === '返回首页' && en ? 'Back to home' : backLabel;
  const bookTitle = title?.trim() || story.meta?.title || (en ? 'Untitled interactive story' : '未命名互动小说');
  const startId = story.meta?.start || Object.keys(story.nodes)[0];
  const origin = useMemo<Snapshot>(
    () => ({ nodeId: startId, stats: initialStats(story.meta), facts: [], via: [startId] }),
    [startId, story.meta],
  );
  const [nodeId, setNodeId] = useState(startId);
  const [stats, setStats] = useState(origin.stats);
  const [facts, setFacts] = useState<string[]>(origin.facts);
  const [path, setPath] = useState<Snapshot[]>([origin]);
  const [explored, setExplored] = useState<string[]>([startId]);
  const [memory, setMemory] = useState<Record<string, Snapshot>>({ [startId]: origin });
  const [tocOpen, setTocOpen] = useState(defaultTocOpen);
  const [statsOpen, setStatsOpen] = useState(false);
  const [lastDelta, setLastDelta] = useState<LastDelta | null>(null);
  const [progressReady, setProgressReady] = useState(!storyId || authorPreview);
  const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<PendingWrite | null>(null);
  const sawWritingRef = useRef(false);
  const storyRef = useRef(story);
  storyRef.current = story;
  const node = story.nodes[nodeId];
  const factSet = useMemo(() => new Set(facts), [facts]);
  const writtenIds = useMemo(() => Object.keys(story.nodes), [story.nodes]);
  const flowRows = useMemo(() => {
    const visible = authorPreview ? writtenIds : explored;
    return buildStoryFlow(story, visible, path.map((step) => step.nodeId));
  }, [authorPreview, explored, path, story, writtenIds]);
  const flowGroups = useMemo(() => groupFlow(flowRows), [flowRows]);
  const statDefs = story.meta?.stats ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [nodeId, pendingWrite]);

  useEffect(() => {
    if (!pendingWrite) {
      sawWritingRef.current = false;
      return;
    }
    if (writing) sawWritingRef.current = true;
  }, [pendingWrite, writing]);

  useEffect(() => {
    if (!statsOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (statsRef.current?.contains(target)) return;
      setStatsOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [statsOpen]);

  useEffect(() => {
    if (authorPreview || !storyId) {
      setProgressReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const saved = await loadProgressAsync(storyId);
      if (cancelled) return;
      if (saved?.nodeId && story.nodes[saved.nodeId]) {
        const snap: Snapshot = {
          nodeId: saved.nodeId,
          stats: saved.stats || origin.stats,
          facts: saved.facts || [],
          via: saved.path?.[saved.path.length - 1]?.via || saved.explored || [saved.nodeId],
        };
        setNodeId(saved.nodeId);
        setStats(snap.stats);
        setFacts(snap.facts);
        setPath(saved.path?.length ? saved.path : [snap]);
        setExplored(saved.explored?.length ? saved.explored : [saved.nodeId]);
        setMemory(saved.memory && Object.keys(saved.memory).length ? saved.memory : { [saved.nodeId]: snap });
      }
      setProgressReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authorPreview, origin, story.nodes, storyId]);

  useEffect(() => {
    if (authorPreview || !onProgress) return;
    const current = story.nodes[nodeId];
    if (!current) return;
    onProgress({
      title: bookTitle,
      chapter: current.chapter.includes(current.title) ? current.chapter : `${current.chapter} · ${current.title}`,
    });
  }, [authorPreview, bookTitle, nodeId, onProgress, story]);

  useEffect(() => {
    if (!progressReady || authorPreview || !storyId) return;
    const current = story.nodes[nodeId];
    if (!current) return;
    rememberRead({
      id: storyId,
      title: bookTitle,
      chapter: current.chapter.includes(current.title) ? current.chapter : `${current.chapter} · ${current.title}`,
      nodeId,
      stats,
      facts,
      path,
      explored,
      memory,
    });
  }, [authorPreview, bookTitle, explored, facts, memory, nodeId, path, progressReady, stats, story, storyId]);

  function clearPendingWrite() {
    pendingRef.current = null;
    setPendingWrite(null);
  }

  function restart() {
    clearPendingWrite();
    setNodeId(origin.nodeId);
    setStats(origin.stats);
    setFacts(origin.facts);
    setPath([origin]);
    setExplored([origin.nodeId]);
    setMemory({ [origin.nodeId]: origin });
    setStatsOpen(false);
    setLastDelta(null);
    onRestartRequest?.();
  }

  function openVisited(id: string) {
    clearPendingWrite();
    const snap = memory[id];
    if (!snap) {
      if (!authorPreview || !story.nodes[id]) return;
      setNodeId(id);
      setLastDelta(null);
      return;
    }
    setNodeId(snap.nodeId);
    setStats(snap.stats);
    setFacts(snap.facts);
    setLastDelta(null);
    const via = snap.via?.length ? snap.via : null;
    if (via) {
      const steps = via.map((nid) => memory[nid]).filter(Boolean);
      if (steps.length) setPath(steps);
      return;
    }
    const idx = path.findIndex((step) => step.nodeId === id);
    if (idx >= 0) setPath(path.slice(0, idx + 1));
  }

  function requestMissingWrite(choice: StoryChoice) {
    if (!onWriteMissing || !node) return;
    const pending = { fromId: node.id, choice };
    pendingRef.current = pending;
    setPendingWrite(pending);
    onWriteMissing({ fromId: node.id, fromTitle: node.title, choice });
  }

  function requestWriteNode(targetId: string) {
    if (!onWriteMissing || !targetId) return;
    const fromFlow = structure?.flowchart.find((item) => item.next.includes(targetId) && story.nodes[item.id]);
    const fromId = fromFlow?.id || node?.id || startId;
    const fromNode = story.nodes[fromId];
    const existing = fromNode?.choices.find((choice) => choice.next === targetId);
    const choice: StoryChoice =
      existing || { id: `plan-${targetId}`, text: '下一章', next: targetId, pageTurn: true };
    const pending = { fromId, choice };
    pendingRef.current = pending;
    setPendingWrite(pending);
    onWriteMissing({ fromId, fromTitle: fromNode?.title || fromId, choice });
  }

  function goNext(choice: StoryChoice) {
    const currentStory = storyRef.current;
    const nextId = resolveNodeId(currentStory, choice.next);
    if (!nextId || !currentStory.nodes[nextId]) {
      if (onWriteMissing) {
        requestMissingWrite(choice);
        return false;
      }
      if (!nextId) return false;
    }
    const resolved = { ...choice, next: nextId || choice.next };
    const next = applyChoice(resolved, stats, factSet, statDefs);
    const via = [...path.map((step) => step.nodeId), resolved.next];
    const nextFacts = [...next.facts];
    const snap: Snapshot = {
      nodeId: resolved.next,
      stats: next.stats,
      facts: nextFacts,
      via,
    };
    const delta = describeDelta(stats, next.stats, facts, nextFacts, currentStory.meta);
    const hasDelta = delta.stats.length > 0 || delta.facts.length > 0;
    setLastDelta(hasDelta ? delta : null);
    setStats(next.stats);
    setFacts(nextFacts);
    setNodeId(resolved.next);
    setPath((steps) => [...steps, snap]);
    setExplored((ids) => (ids.includes(resolved.next) ? ids : [...ids, resolved.next]));
    setMemory((prev) => ({ ...prev, [resolved.next]: snap }));
    const fromNode = currentStory.nodes[nodeId];
    const realChoice = (fromNode?.choices.length ?? 0) > 1;
    setStatsOpen(hasDelta && realChoice);
    return true;
  }

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const currentStory = storyRef.current;
    const nextId = resolveNodeId(currentStory, pending.choice.next);
    if (!nextId || !currentStory.nodes[nextId]?.body?.trim()) return;
    if (goNext({ ...pending.choice, next: nextId })) clearPendingWrite();
  }, [pendingWrite, story.nodes]);

  function flowNodeButton(row: Extract<FlowRow, { type: 'node' }>) {
    const item = story.nodes[row.id];
    if (!item) return null;
    const mark = flowKindMark(row.sceneKind);
    return (
      <button
        type="button"
        className={`toc-card${item.id === nodeId ? ' current' : ''}${authorPreview && !explored.includes(item.id) ? ' unseen' : ''}${row.spine ? ' spine' : ''}${row.sceneKind === 'choice' ? ' choice' : ''}${row.sceneKind === 'ending' ? ' ending' : ''}${row.sceneKind === 'merge' ? ' merge' : ''}`}
        onClick={() => openVisited(item.id)}
      >
        <em>{item.title}</em>
        {mark ? <i>{mark}</i> : null}
      </button>
    );
  }

  function planNodeButton(item: FlowNode) {
    const written = story.nodes[item.id];
    const mark = FLOW_KIND[item.kind];
    return (
      <button
        type="button"
        className={`toc-card${item.id === nodeId ? ' current' : ''}${written ? '' : ' planned'}${item.kind === 'choice' ? ' choice' : ''}${item.kind === 'ending' ? ' ending' : ''}${item.kind === 'merge' ? ' merge' : ''}`}
        onClick={() => (written ? openVisited(item.id) : requestWriteNode(item.id))}
      >
        <em>{written?.title || item.id}</em>
        {mark ? <i>{mark}</i> : null}
      </button>
    );
  }

  function renderPlanTree(tree: FlowTree) {
    if (tree.type === 'node') {
      return (
        <div className="flow-chain" key={tree.node.id}>
          {planNodeButton(tree.node)}
          {tree.next ? (
            <>
              <div className="flow-line" aria-hidden="true" />
              {renderPlanTree(tree.next)}
            </>
          ) : null}
        </div>
      );
    }
    return (
      <div className="flow-chain" key={tree.node.id}>
        {planNodeButton(tree.node)}
        {tree.arms.length > 0 ? (
          <div className="flow-fork">
            <div className="flow-split" aria-hidden="true" />
            <div className="flow-fork-row">
              {tree.arms.map((arm) => (
                <div className="flow-fork-col" key={arm.node.id}>
                  {renderPlanTree(arm)}
                </div>
              ))}
            </div>
            {tree.join ? <div className="structure-join" aria-hidden="true" /> : null}
          </div>
        ) : null}
        {tree.join ? (
          <>
            <div className="flow-line" aria-hidden="true" />
            {renderPlanTree(tree.join)}
          </>
        ) : null}
      </div>
    );
  }

  if (!node) {
    return (
      <div className="reader-empty">
        {onBack ? (
          <header className="reader-bar">
            <button type="button" className="reader-icon" aria-label={actualBackLabel} onClick={onBack}>
              <IconBack />
            </button>
          </header>
        ) : null}
        <div>
          <p>{en ? 'There are no readable scenes yet.' : '阅读器还没有可进入的节点。'}</p>
          <p>{en ? 'Scenes will appear here once the story is written.' : '开始写正文后，章节会显示在这里。'}</p>
        </div>
      </div>
    );
  }

  const visibleStats = statDefs.filter((s) => s.visible);
  const body = renderBody(node.body, factSet, stats, { revealBranches: authorPreview });
  const paragraphs = body.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const choices = (node.choices || []).filter((c) =>
    authorPreview ? true : choiceAvailable(c, stats, factSet, statDefs),
  );
  const changedStat = new Set(lastDelta?.stats.map((s) => s.id) ?? []);
  const waitingNext = pendingWrite?.choice.next || '';
  const waitingFailed = Boolean(pendingWrite) && !writing && (Boolean(writeError) || sawWritingRef.current);
  const chapterLine = pendingWrite
    ? `${en ? 'Writing' : '正在写'} · ${waitingNext}`
    : node.chapter.includes(node.title)
      ? node.chapter
      : `${node.chapter} · ${node.title}`;
  const isPageTurn =
    !node.isEnding &&
    choices.length === 1 &&
    (choices[0].pageTurn || isPageTurnText(choices[0].text));
  const flowHere = structure?.flowchart.find((item) => item.id === node.id || item.id === node.title);
  const structuralEnding = flowHere ? flowHere.kind === 'ending' : node.isEnding;
  const streamingThis = writing && node.id === writtenIds[writtenIds.length - 1];
  const plannedNext = structuralEnding || choices.length > 0 ? [] : nextChapterIds(structure, node.id, node.title);
  const continueTargets = (plannedNext.length ? plannedNext : onWriteMissing ? [''] : []).filter((id) => {
    if (!id) return true;
    const resolved = resolveNodeId(story, id);
    if (resolved && story.nodes[resolved]?.body?.trim()) return true;
    return Boolean(onWriteMissing);
  });
  const canContinue = !structuralEnding && !streamingThis && choices.length === 0 && continueTargets.length > 0;
  const choiceLabel = canContinue || isPageTurn ? (en ? 'Continue' : '读下去') : structuralEnding || choices.length === 0 ? (en ? 'End of chapter' : '本章结束') : (en ? 'You decide' : '此刻，你决定');

  function continueChapter(targetId: string) {
    const nextName = targetId || (en ? 'the next scene in the story map' : '按流程图紧接着的下一节点');
    const choice: StoryChoice = {
      id: `next-${targetId || 'chapter'}`,
      text: en ? 'Next chapter' : '下一章',
      next: nextName,
      pageTurn: true,
    };
    const resolved = targetId ? resolveNodeId(story, targetId) : '';
    if (resolved && story.nodes[resolved]?.body?.trim()) {
      goNext({ ...choice, next: resolved });
      return;
    }
    requestMissingWrite(choice);
  }

  return (
    <div className={`reader${tocOpen ? ' toc-open' : ''}${authorPreview ? ' author-preview' : ''}`}>
      <header className="reader-bar">
        {onBack ? (
          <button type="button" className="reader-icon" aria-label={actualBackLabel} onClick={onBack}>
            <IconBack />
          </button>
        ) : null}
        <button
          type="button"
          className={`reader-icon${tocOpen ? ' on' : ''}`}
          aria-expanded={tocOpen}
          aria-label={tocOpen ? (en ? 'Close contents' : '收起目录') : (en ? 'Open contents' : '展开目录')}
          onClick={() => setTocOpen((open) => !open)}
        >
          <IconList open={tocOpen} />
        </button>
        <div className="reader-titles">
          <b>{bookTitle}</b>
          <span>{chapterLine}</span>
        </div>
        <div className="reader-bar-right" ref={statsRef}>
          <button
            type="button"
            className={`reader-icon${statsOpen ? ' on' : ''}`}
            aria-expanded={statsOpen}
            aria-label={statsOpen ? (en ? 'Close status' : '收起状态') : (en ? 'View status' : '查看状态')}
            onClick={() => setStatsOpen((open) => !open)}
          >
            <IconStats />
          </button>
          {statsOpen ? (
            <aside className="reader-stats" aria-label={en ? 'Character status' : '角色状态'}>
              <h4>{en ? 'Status' : '状态'}</h4>
              {visibleStats.length === 0 ? <p>{en ? 'No visible stats in this chapter.' : '本章没有可见状态。'}</p> : null}
              {visibleStats.map((s) => {
                const value = stats[s.id] ?? s.initial;
                const pct = s.max === s.min ? 0 : ((value - s.min) / (s.max - s.min)) * 100;
                const hit = lastDelta?.stats.find((d) => d.id === s.id);
                return (
                  <div className={`stat${changedStat.has(s.id) ? ' changed' : ''}`} key={s.id}>
                    <span>
                      <b>{s.name}</b>
                      <i>
                        {value}
                        {hit ? <em>{signed(hit.delta)}</em> : null}
                      </i>
                    </span>
                    <div className="bar">
                      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                    </div>
                  </div>
                );
              })}
              {facts.length > 0 ? (
                <div className="facts">
                  {facts.map((fact) => (
                    <em key={fact}>{factLabel(fact, story.meta)}</em>
                  ))}
                </div>
              ) : null}
              <button type="button" className="reader-restart" onClick={restart}>
                {en ? 'Start over' : '从头阅读'}
              </button>
            </aside>
          ) : null}
        </div>
      </header>

      <div className="reader-body">
        <nav className="reader-toc" aria-label={authorPreview ? (en ? 'Story flowchart' : '故事流程图') : (en ? 'Unlocked story path' : '已解锁的故事流程')} aria-hidden={!tocOpen}>
          <h4>{en ? 'Story map' : '故事地图'}</h4>
          <p>
            {authorPreview
              ? structure?.flowchart.length
                ? (en ? 'The complete plan is shown here. Gray scenes are not written yet.' : '全书流程图都展开在这里。灰的还没写成正文。')
                : (en ? 'Written scenes are arranged by branches and merges.' : '已写节点按分岔和汇合全部展开。')
              : (en ? 'Only paths you have explored are shown. Revisit a branch to try another route.' : '只显示走过的路。点过分岔可以回头再探。')}
          </p>
          <div className="toc-map">
            {authorPreview && structure?.flowchart.length
              ? layoutFlowPieces(structure.flowchart).map((tree) => renderPlanTree(tree))
              : flowGroups.map((group, index) => {
              if (group.type === 'chapter') {
                return (
                  <b className="toc-chap" key={`chap-${group.chapter}-${index}`}>
                    {group.chapter}
                  </b>
                );
              }
              if (group.type === 'arrow') {
                return <div className="flow-merge" key={`arrow-${index}`} aria-hidden="true" />;
              }
              if (group.type === 'fork' && group.items.length > 1) {
                return (
                  <div className="flow-fork" key={`fork-${index}`}>
                    <div className="flow-split" aria-hidden="true" />
                    <div className="flow-fork-row">
                      {group.items.map((item) => (
                        <div className="flow-fork-col" key={item.id}>
                          {flowNodeButton(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              const item = group.type === 'fork' ? group.items[0] : group.item;
              if (!item) return null;
              const prev = flowGroups[index - 1];
              const linked = prev && prev.type !== 'chapter';
              return (
                <div className="flow-chain" key={`${item.id}-${index}`}>
                  {linked ? <div className="flow-line" aria-hidden="true" /> : null}
                  {flowNodeButton(item)}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="reader-scroll" ref={scrollRef}>
          {pendingWrite ? (
            <article className="reader-page reader-waiting" key={`wait-${waitingNext}`}>
              <div className="chapter-kicker">{waitingFailed ? (en ? 'Not written yet' : '还没写出来') : (en ? 'Writing' : '正在写')}</div>
              <h1>{waitingNext}</h1>
              <p>
                {waitingFailed
                  ? writeError || (en ? 'This scene is not in the manuscript yet. Ask the writer to try again or return to the previous scene.' : '这一场还没落到正文里。你可以再请作家写一次，也可以先回到上一场。')
                  : (en ? 'The writer is working on this scene. It will turn the page automatically when ready.' : '作家正在写这一场。你可以停在这儿等，写好会自己翻过来。')}
              </p>
              {waitingFailed ? (
                <button type="button" onClick={() => goNext(pendingWrite.choice)}>
                  {en ? 'Try again' : '再写一次'}
                </button>
              ) : (
                <p className="reader-writing">{en ? 'Writing' : '正在写'}</p>
              )}
            </article>
          ) : (
            <article className="reader-page" key={nodeId}>
              {structuralEnding ? <span className="ending-flag">{node.endingId && node.endingId !== node.title ? node.endingId : (en ? 'Ending' : '结局')}</span> : null}
              <div className="chapter-kicker">{node.chapter}</div>
              <h1>{node.title}</h1>
              {lastDelta && (lastDelta.stats.length > 0 || lastDelta.facts.length > 0) ? (
                <p className="consequence">
                  {[
                    ...lastDelta.stats.map((s) => `${s.name} ${s.from}→${s.to}`),
                    ...lastDelta.facts.map((label) => `${en ? 'Remember' : '记下'}: ${label}`),
                  ].join(' · ')}
                </p>
              ) : null}
              <div className="prose">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {writing && node.id === writtenIds[writtenIds.length - 1] ? (
                  <p className="reader-writing">{en ? 'Writing' : '正在写'}</p>
                ) : null}
              </div>
              <div className={`choices${isPageTurn || canContinue ? ' page-turn' : ''}`}>
                <div className="choices-label">{choiceLabel}</div>
                {streamingThis && choices.length === 0 ? null : structuralEnding || (choices.length === 0 && !canContinue) ? (
                  <button type="button" onClick={restart}>
                    {en ? 'The end · Start over' : '这一页到此结束 · 重新开始'}
                  </button>
                ) : canContinue ? (
                  continueTargets.map((targetId) => {
                    const resolved = targetId ? resolveNodeId(story, targetId) : '';
                    const nextTitle = (resolved && story.nodes[resolved]?.title) || targetId;
                    const single = continueTargets.length === 1;
                    return (
                      <button type="button" key={targetId || 'next-chapter'} onClick={() => continueChapter(targetId)}>
                        {single ? (en ? 'Next chapter' : '下一章') : authorPreview && nextTitle ? `${en ? 'Next chapter' : '下一章'} · ${nextTitle}` : nextTitle || (en ? 'Next chapter' : '下一章')}
                      </button>
                    );
                  })
                ) : (
                  choices.map((choice) => {
                    const nextId = resolveNodeId(story, choice.next);
                    const nextTitle = (nextId && story.nodes[nextId]?.title) || choice.next;
                    return (
                      <button type="button" key={choice.id} onClick={() => goNext(choice)}>
                        {isPageTurn
                          ? authorPreview
                            ? `${en ? 'Next chapter' : '下一章'} · ${nextTitle}`
                            : (en ? 'Next chapter' : '下一章')
                          : choice.text}
                        {choice.meaning ? <small>{choice.meaning}</small> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
