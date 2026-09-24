'use client';

import { useEffect, useRef, useState } from 'react';
import { BubbleGarden } from '@/components/BubbleGarden';
import { type TopicCard } from '@/lib/topic-prompt';
import { AUDIENCES, audienceLabel, type Audience } from '@/lib/topic-tags';
import { useLocale } from '@/components/LocaleProvider';

export type TopicPick = {
  audience: Audience;
  audienceName: string;
  path: string[];
  topic: TopicCard;
};

async function requestTopics(
  path: string[],
  audience: Audience,
  round: number,
  exclude: string[],
  signal: AbortSignal,
  locale: 'en' | 'zh',
): Promise<TopicCard[]> {
  const res = await fetch('/api/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, audience, round, exclude, locale }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || (locale === 'zh' ? '生成失败' : 'Generation failed'));
  const cards = Array.isArray(data.topics) ? (data.topics as TopicCard[]) : [];
  if (cards.length < 3) throw new Error(locale === 'zh' ? '选题不足' : 'Not enough ideas were generated');
  return cards.slice(0, 3);
}

export function TopicPicker({ onConfirm }: { onConfirm: (pick: TopicPick) => void }) {
  const { locale } = useLocale();
  const [audience, setAudience] = useState<Audience>('female');
  const [path, setPath] = useState<string[]>([]);
  const [visible, setVisible] = useState<TopicCard[]>([]);
  const [chosen, setChosen] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const roundRef = useRef(1);
  const requestIdRef = useRef(0);
  const pathRef = useRef<string[]>([]);
  const audienceRef = useRef<Audience>('female');
  const visibleRef = useRef<TopicCard[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  pathRef.current = path;
  audienceRef.current = audience;
  visibleRef.current = visible;

  function loadTopics(nextPath: string[], exclude: string[]) {
    abortRef.current?.abort();
    if (!nextPath.length) {
      setVisible([]);
      setWaiting(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const reqId = ++requestIdRef.current;
    const round = ++roundRef.current;
    setVisible([]);
    setChosen(0);
    setWaiting(true);
    requestTopics(nextPath, audienceRef.current, round, exclude, ctrl.signal, locale)
      .then((cards) => {
        if (reqId !== requestIdRef.current) return;
        setVisible(cards);
        setWaiting(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || reqId !== requestIdRef.current) return;
        setWaiting(false);
      });
  }

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (!path.length) {
      setVisible([]);
      setWaiting(false);
      return;
    }
    const stamp = path.join('\u0001');
    setVisible([]);
    setChosen(0);
    setWaiting(true);
    timerRef.current = window.setTimeout(() => {
      if (pathRef.current.join('\u0001') === stamp) loadTopics(path, []);
    }, 220);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [path, audience, locale]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function refresh() {
    if (!path.length || waiting) return;
    loadTopics(path, visibleRef.current.map((item) => item.title));
  }

  const card = visible[chosen];

  return (
    <div className="topic-picker">
      <header className="topic-picker-head">
        <p>{locale === 'zh' ? '描述你的故事方向' : 'Choose a direction for your story'}</p>
        <div className="topic-tabs" role="tablist" aria-label={locale === 'zh' ? '受众方向' : 'Audience'}>
          {AUDIENCES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={audience === item.id}
              className={audience === item.id ? 'on' : ''}
              onClick={() => {
                setAudience(item.id);
                setPath([]);
                setVisible([]);
                roundRef.current = 1;
              }}
            >
              {audienceLabel(item.id, locale)}
            </button>
          ))}
        </div>
      </header>
      <div className="topic-stage">
        <BubbleGarden audience={audience} onChange={setPath} locale={locale} />
        <div className="topic-reco">
          <div className="topic-reco-head">
            <span>{locale === 'zh' ? '创作方向' : 'Story ideas'} · {path.length ? (locale === 'zh' ? `根据 ${path.length} 个标签生成` : `Based on ${path.length} tags`) : (locale === 'zh' ? '点选气泡后生成' : 'Select a bubble to generate')}</span>
            <button type="button" className="topic-refresh" disabled={!path.length || waiting} onClick={refresh}>
              {waiting ? (locale === 'zh' ? '生成中…' : 'Generating…') : (locale === 'zh' ? '🎲 换一批' : '🎲 New ideas')}
            </button>
          </div>
          {visible.length ? (
            <div className="topic-cards">
              {visible.map((item, i) => (
                <button
                  key={`${item.style}-${item.title}`}
                  type="button"
                  className={`topic-card${chosen === i ? ' on' : ''}`}
                  onClick={() => setChosen(i)}
                >
                  <small>
                    0{i + 1} {item.style}
                  </small>
                  <b>
                    {path.join(' × ')}
                    {chosen === i ? ' ✓' : ''}
                  </b>
                  <p>{item.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="topic-hint">
              {waiting ? (locale === 'zh' ? '正在生成选题…' : 'Generating story ideas…') : (locale === 'zh' ? '点选气泡，向下钻一层或停在这里，底部会吐出 3 个选题。' : 'Select bubbles to explore, then choose one of three generated ideas.')}
            </p>
          )}
          <button
            type="button"
            className="topic-go"
            disabled={!card || waiting}
            onClick={() => {
              if (!card) return;
              onConfirm({
                audience,
                audienceName: audienceLabel(audience, locale),
                path,
                topic: card,
              });
            }}
          >
            {locale === 'zh' ? '选择' : 'Choose'}
          </button>
        </div>
      </div>
    </div>
  );
}
