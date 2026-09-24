'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { FeedCard } from '@/lib/feed';
import { apiJson } from '@/lib/client-api';
import { useLocale } from '@/components/LocaleProvider';
import type { ReaderGender } from '@/lib/i18n';
import { usePreferences } from '@/components/ConsumeShell';

export function StoryFeed() {
  const { locale, t } = useLocale();
  const { preferences, savePreferences } = usePreferences();
  const [stories, setStories] = useState<FeedCard[]>([]);
  const [gender, setGender] = useState<ReaderGender>(preferences.gender);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGender(preferences.gender);
  }, [preferences.gender]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');
    (async () => {
      try {
        const remote = await apiJson<{ stories: FeedCard[] }>(`/api/feed?language=${locale}&gender=${gender}`);
        if (!cancelled) {
          setStories(Array.isArray(remote.stories) ? remote.stories : []);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : locale === 'zh' ? '列表加载失败' : 'Unable to load stories');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gender, locale]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const root = feedRef.current;
      if (!root) return;
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const card = root.querySelector('.feed-card');
      if (!card) return;
      event.preventDefault();
      const dir = event.key === 'ArrowDown' ? 1 : -1;
      const styles = getComputedStyle(root);
      const gap = Number.parseFloat(styles.rowGap || styles.gap || '0') || 0;
      root.scrollBy({
        top: dir * (card.getBoundingClientRect().height + gap),
        behavior: 'smooth',
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stories.length]);

  return (
    <div className="home-discovery">
      <div className="audience-tabs" role="tablist" aria-label={t('audience')}>
        {(['all', 'female', 'male'] as ReaderGender[]).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={gender === item} className={gender === item ? 'on' : ''} onClick={() => {
            setGender(item);
            void savePreferences({ ...preferences, gender: item });
          }}>
            {t(item)}
          </button>
        ))}
      </div>
      {!ready ? <div className="consume-empty"><p>{t('loadingStories')}</p></div> : null}
      {ready && error ? <div className="consume-empty"><p>{error}</p></div> : null}
      {ready && !error && stories.length === 0 ? (
        <div className="consume-empty">
          <p>{t('noStories')}</p>
          <Link className="ghost" href="/create">{t('writeOne')}</Link>
        </div>
      ) : null}
      {ready && !error && stories.length > 0 ? <div className="feed" ref={feedRef}>
      {stories.map((story) => (
        <Link key={story.id} href={`/read/${story.id}`} className="feed-card">
          <article className="feed-sheet">
            <header className="feed-head">
              <h1>{story.title}</h1>
              {story.summary || story.logline ? <p className="feed-logline">{story.summary || story.logline}</p> : null}
              {story.tags?.length ? <div className="feed-tags">{story.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
            </header>
            <div className="feed-prologue">
              <div className="feed-kicker">{story.chapter || (locale === 'zh' ? '序章' : 'Prologue')}</div>
              {story.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="feed-foot">
              <span>{t('startPlaying')}</span>
            </div>
          </article>
        </Link>
      ))}
      </div> : null}
    </div>
  );
}
