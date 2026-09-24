'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Reader } from '@/components/Reader';
import { storyFromProse } from '@/lib/parse-story';
import { parseStructure } from '@/lib/structure';
import { apiJson } from '@/lib/client-api';
import type { StoryData } from '@/lib/types';
import { useLocale } from '@/components/LocaleProvider';

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const [story, setStory] = useState<StoryData | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<{ title?: string; proseDoc: string; chaptersDoc?: string }>(
          `/api/publications/${id}`,
        );
        if (!cancelled) {
          const structure = parseStructure(typeof data.chaptersDoc === 'string' ? data.chaptersDoc : '');
          setTitle(typeof data.title === 'string' ? data.title.trim() : '');
          setStory(storyFromProse(data.proseDoc, structure));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : locale === 'zh' ? '打开失败' : 'Unable to open this story');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, locale]);

  if (error) {
    return (
      <div className="consume-read">
        <div className="consume-empty">
          <p>{error}</p>
          <button type="button" className="ghost" onClick={() => router.push('/')}>
            {locale === 'zh' ? '回首页' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="consume-read">
        <div className="consume-empty">
          <p>{locale === 'zh' ? '正在打开故事…' : 'Opening story…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consume-read">
      <Reader
        story={story}
        storyId={params.id}
        title={title}
        defaultTocOpen={false}
        backLabel={locale === 'zh' ? '返回主页' : 'Story home'}
        onBack={() => router.push(`/novel/${params.id}`)}
      />
    </div>
  );
}
