'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { formatReadAt, type ReadingRecord } from '@/lib/reading-history';
import { apiJson } from '@/lib/client-api';
import { createStoryPath, displayTitle, type StoryProject } from '@/lib/stories';
import { useLocale } from '@/components/LocaleProvider';

export default function MePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const en = locale === 'en';
  const [stories, setStories] = useState<StoryProject[]>([]);
  const [history, setHistory] = useState<ReadingRecord[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiJson('/api/me');
        const [storyData, progressData] = await Promise.all([
          apiJson<{ stories: StoryProject[] }>('/api/stories'),
          apiJson<{ records: ReadingRecord[] }>('/api/progress'),
        ]);
        if (cancelled) return;
        setStories(storyData.stories ?? []);
        setHistory(progressData.records ?? []);
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : en ? 'Unable to load' : '无法加载');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const drafts = stories.filter(
    (item) => item.topicTitle.trim() || item.publishedId || (item.title.trim() && item.title !== '未命名故事'),
  );

  function continueWrite(id: string) {
    router.push(createStoryPath(id));
  }

  return (
    <div className="me-page">
      <header className="me-head">
        <div>
          <h1>{en ? 'My library' : '我的'}</h1>
          <p>{en ? 'Drafts and reading progress stay with your account on every device.' : '草稿和阅读进度会跟着账号走。换设备登录，还能接着写、接着玩。'}</p>
        </div>
        <div className="me-account">
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <UserButton /> : null}
        </div>
      </header>

      {error ? (
        <p className="me-empty">
          {error === '请先登录' ? (
            <>
              {en ? 'Sign in to sync drafts and reading progress.' : '未登录也可以先看看。登录后，草稿和阅读进度会跟账号走。'}
              <Link href="/sign-in">{en ? 'Sign in' : '去登录'}</Link>
            </>
          ) : (
            error
          )}
        </p>
      ) : null}

      <section className="me-section" aria-labelledby="me-drafts">
        <h2 id="me-drafts">{en ? 'My stories' : '我写的'}</h2>
        {!ready ? (
          <p className="me-empty">{en ? 'Loading drafts…' : '正在载入草稿…'}</p>
        ) : drafts.length === 0 ? (
          <p className="me-empty">
            {en ? 'No stories yet.' : '还没有自己的故事。'}
            <Link href="/create">{en ? 'Create one' : '去创作'}</Link>
          </p>
        ) : (
          <ul className="me-list">
            {drafts.map((item) => (
              <li key={item.id}>
                <div>
                  <b>{displayTitle(item)}</b>
                  <span>{item.publishedId ? (en ? 'Published' : '已发布到首页') : (en ? 'Draft' : '草稿')}</span>
                </div>
                <div className="me-actions">
                  <button type="button" onClick={() => continueWrite(item.id)}>
                    {en ? 'Continue writing' : '继续写'}
                  </button>
                  {item.publishedId ? <Link href={`/read/${item.publishedId}`}>{en ? 'Read' : '去读'}</Link> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="me-section" aria-labelledby="me-history">
        <h2 id="me-history">{en ? 'Reading history' : '玩过的'}</h2>
        {!ready ? (
          <p className="me-empty">{en ? 'Loading progress…' : '正在载入进度…'}</p>
        ) : history.length === 0 ? (
          <p className="me-empty">
            {en ? 'No reading history yet.' : '还没有读过故事。'}
            <Link href="/">{en ? 'Explore stories' : '去首页看看'}</Link>
          </p>
        ) : (
          <ul className="me-list">
            {history.map((item) => (
              <li key={item.id}>
                <div>
                  <b>{item.title}</b>
                  <span>
                    {item.chapter ? (en ? `At ${item.chapter} · ` : `读到 ${item.chapter} · `) : ''}
                    {formatReadAt(item.readAt)}
                  </span>
                </div>
                <div className="me-actions">
                  <Link href={`/read/${item.id}`}>{en ? 'Continue' : '继续玩'}</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
