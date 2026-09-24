'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { apiJson } from '@/lib/client-api';
import type { ReaderGender } from '@/lib/i18n';

type NovelHome = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  gender: ReaderGender;
  excerpt: string;
  wordCount: number;
};

export default function NovelHomePage() {
  const params = useParams<{ id: string }>();
  const { locale, t } = useLocale();
  const [novel, setNovel] = useState<NovelHome | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson<NovelHome>(`/api/publications/${params.id}?view=home`)
      .then((data) => {
        if (!cancelled) setNovel(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : locale === 'zh' ? '无法打开这部小说' : 'Unable to open this novel');
      });
    return () => {
      cancelled = true;
    };
  }, [locale, params.id]);

  if (error) return <div className="consume-empty"><p>{error}</p><Link className="ghost" href="/">{t('backHome')}</Link></div>;
  if (!novel) return <div className="consume-empty"><p>{locale === 'zh' ? '正在打开小说…' : 'Opening novel…'}</p></div>;

  return (
    <main className="novel-home">
      <Link href="/" className="novel-back">← {t('backHome')}</Link>
      <section className="novel-hero">
        <div className="novel-eyebrow">SPARK INTERACTIVE NOVEL</div>
        <h1>{novel.title}</h1>
        <p className="novel-summary">{novel.summary}</p>
        <div className="novel-meta">
          <span>{t('audience')}: {t(novel.gender)}</span>
          {novel.wordCount ? <span>{novel.wordCount.toLocaleString()} {t('words')}</span> : null}
        </div>
        <div className="novel-tags" aria-label={t('themes')}>
          {novel.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <Link href={`/read/${novel.id}`} className="novel-start">{t('begin')} <span>→</span></Link>
      </section>
      {novel.excerpt ? (
        <section className="novel-preview">
          <h2>{locale === 'zh' ? '开场试读' : 'Opening preview'}</h2>
          {novel.excerpt.split(/\n{2,}|\n/).filter(Boolean).slice(0, 4).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      ) : null}
    </main>
  );
}
