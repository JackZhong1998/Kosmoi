'use client';

import { useMemo, useState } from 'react';
import {
  applyChoice,
  choiceAvailable,
  initialStats,
  renderBody,
} from '@/lib/parse-story';
import type { StoryData } from '@/lib/types';

export function Reader({
  story,
  onRestartRequest,
}: {
  story: StoryData;
  onRestartRequest?: () => void;
}) {
  const startId = story.meta?.start || Object.keys(story.nodes)[0];
  const [nodeId, setNodeId] = useState(startId);
  const [stats, setStats] = useState(() => initialStats(story.meta));
  const [facts, setFacts] = useState<string[]>([]);
  const node = story.nodes[nodeId];
  const factSet = useMemo(() => new Set(facts), [facts]);

  function restart() {
    setNodeId(startId);
    setStats(initialStats(story.meta));
    setFacts([]);
    onRestartRequest?.();
  }

  if (!node) {
    return (
      <div className="reader-empty">
        <div>
          <p>阅读器还没有可进入的节点。</p>
          <p>开始写正文后，章节会显示在这里。</p>
        </div>
      </div>
    );
  }

  const visibleStats = (story.meta?.stats ?? []).filter((s) => s.visible);
  const body = renderBody(node.body, factSet, stats);
  const paragraphs = body.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const choices = (node.choices || []).filter((c) => choiceAvailable(c, stats, factSet));

  return (
    <div className="reader">
      <div className="reader-top">
        <div>
          <h3>{story.meta?.title || '未命名互动小说'}</h3>
          <small>{story.meta?.logline}</small>
        </div>
        <div className="stats">
          {visibleStats.map((s) => {
            const value = stats[s.id] ?? s.initial;
            const pct = s.max === s.min ? 0 : ((value - s.min) / (s.max - s.min)) * 100;
            return (
              <div className="stat" key={s.id}>
                <span>
                  <b>{s.name}</b>
                  <i>{value}</i>
                </span>
                <div className="bar">
                  <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                </div>
              </div>
            );
          })}
          <button className="ghost" onClick={restart} style={{ color: '#3b2f23', borderColor: 'rgba(59,47,35,0.2)' }}>
            从头阅读
          </button>
        </div>
      </div>
      <div className="reader-scroll">
        {node.isEnding ? <span className="ending-flag">{node.endingId || '结局'}</span> : null}
        <div className="chapter-kicker">{node.chapter}</div>
        <h1>{node.title}</h1>
        <div className="prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
      <div className="choices">
        {node.isEnding || choices.length === 0 ? (
          <button onClick={restart}>这一页到此结束 · 重新开始</button>
        ) : (
          choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => {
                const next = applyChoice(choice, stats, factSet, story.meta?.stats ?? []);
                setStats(next.stats);
                setFacts([...next.facts]);
                setNodeId(choice.next);
              }}
            >
              {choice.text}
              {choice.meaning ? <small>{choice.meaning}</small> : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
