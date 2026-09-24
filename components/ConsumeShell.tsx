'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { prefetchCreateWorkspace } from '@/lib/create-workspace';
import { createStoryPath, readLastCreateId } from '@/lib/stories';
import { useLocale } from '@/components/LocaleProvider';
import { apiJson } from '@/lib/client-api';
import type { Locale, ReaderGender } from '@/lib/i18n';

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4.5 11.2 12 4.8l7.5 6.4V20a1 1 0 0 1-1 1h-4.2v-6.2H9.7V21H5.5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCreate() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMe() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 12a3.6 3.6 0 1 0 0-7.2A3.6 3.6 0 0 0 12 12Zm0 2.2c-3.4 0-6.2 1.7-6.2 3.8V20h12.4v-2c0-2.1-2.8-3.8-6.2-3.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ConsumeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { isLoaded, isSignedIn } = useAuth();
  const [createHref, setCreateHref] = useState('/create');
  const [preferences, setPreferences] = useState<{ language: Locale; gender: ReaderGender; completed: boolean } | null>(null);
  const [preferenceError, setPreferenceError] = useState('');

  const nav = [
    { href: '/', label: t('home'), Icon: IconHome },
    { href: '/create', label: t('create'), Icon: IconCreate },
    { href: '/me', label: t('me'), Icon: IconMe },
  ] as const;

  useEffect(() => {
    const lastId = readLastCreateId();
    if (lastId) setCreateHref(createStoryPath(lastId));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(pathname || '/')}`);
      return;
    }
    let cancelled = false;
    apiJson<{ language: Locale; gender: ReaderGender; completed: boolean }>('/api/preferences')
      .then((data) => {
        if (cancelled) return;
        setPreferences(data);
        setLocale(data.language);
      })
      .catch((err) => {
        if (!cancelled) setPreferenceError(err instanceof Error ? err.message : 'Unable to load preferences');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, pathname, router, setLocale]);

  async function savePreferences(next: { language: Locale; gender: ReaderGender; completed: boolean }) {
    setPreferenceError('');
    setLocale(next.language);
    const saved = await apiJson<{ language: Locale; gender: ReaderGender; completed: boolean }>('/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify(next),
    });
    setPreferences(saved);
    window.dispatchEvent(new CustomEvent('spark-preferences', { detail: saved }));
  }

  if (!isLoaded || (isSignedIn && !preferences && !preferenceError)) {
    return <div className="consume-empty"><p>{locale === 'zh' ? '正在准备火花…' : 'Preparing Spark…'}</p></div>;
  }

  if (!isSignedIn) return null;

  return (
    <div className="consume">
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <CreatePrefetch /> : null}
      <nav className="consume-nav" aria-label={locale === 'zh' ? '主导航' : 'Main navigation'}>
        {nav.map((item) => {
          const href = item.href === '/create' ? createHref : item.href;
          const on = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`consume-nav-item${on ? ' on' : ''}`}
              onMouseEnter={() => {
                if (item.href === '/create') prefetchCreateWorkspace(readLastCreateId());
              }}
            >
              <item.Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {preferences?.completed ? (
        <LanguageSwitch
          className="language-switch desktop"
          locale={locale}
          label={t('language')}
          onChange={(language) => void savePreferences({ ...preferences, language })}
        />
      ) : null}
      <main className="consume-main">{children}</main>
      {pathname === '/' && preferences?.completed ? (
        <LanguageSwitch
          className="language-switch mobile"
          locale={locale}
          label={t('language')}
          onChange={(language) => void savePreferences({ ...preferences, language })}
        />
      ) : null}
      {preferences && !preferences.completed ? (
        <Onboarding
          initial={preferences}
          error={preferenceError}
          onLanguage={setLocale}
          onFinish={savePreferences}
        />
      ) : null}
    </div>
  );
}

function LanguageSwitch({
  locale,
  label,
  className,
  onChange,
}: {
  locale: Locale;
  label: string;
  className: string;
  onChange: (locale: Locale) => void;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <select value={locale} onChange={(event) => onChange(event.target.value as Locale)}>
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </label>
  );
}

function Onboarding({
  initial,
  error,
  onLanguage,
  onFinish,
}: {
  initial: { language: Locale; gender: ReaderGender };
  error: string;
  onLanguage: (locale: Locale) => void;
  onFinish: (value: { language: Locale; gender: ReaderGender; completed: boolean }) => Promise<void>;
}) {
  const { t } = useLocale();
  const [step, setStep] = useState<'language' | 'gender'>('language');
  const [language, setLanguage] = useState<Locale>(initial.language || 'en');
  const [gender, setGender] = useState<ReaderGender>(initial.gender || 'all');
  const [saving, setSaving] = useState(false);

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="onboarding-card">
        <div className="onboarding-step">{step === 'language' ? '1 / 2' : '2 / 2'}</div>
        <h1 id="onboarding-title">{step === 'language' ? t('chooseLanguage') : t('chooseGender')}</h1>
        <p>{step === 'language' ? t('chooseLanguageBody') : t('chooseGenderBody')}</p>
        {step === 'language' ? (
          <div className="onboarding-options two">
            {(['en', 'zh'] as Locale[]).map((item) => (
              <button
                key={item}
                type="button"
                className={language === item ? 'on' : ''}
                onClick={() => {
                  setLanguage(item);
                  onLanguage(item);
                }}
              >
                {item === 'en' ? 'English' : '中文'}
              </button>
            ))}
          </div>
        ) : (
          <div className="onboarding-options three">
            {(['female', 'male', 'all'] as ReaderGender[]).map((item) => (
              <button key={item} type="button" className={gender === item ? 'on' : ''} onClick={() => setGender(item)}>
                {t(item)}
              </button>
            ))}
          </div>
        )}
        {error ? <p className="onboarding-error">{error}</p> : null}
        <button
          type="button"
          className="onboarding-primary"
          disabled={saving}
          onClick={() => {
            if (step === 'language') {
              setStep('gender');
              return;
            }
            setSaving(true);
            void onFinish({ language, gender, completed: true }).finally(() => setSaving(false));
          }}
        >
          {saving ? t('onboardingSaving') : step === 'language' ? t('continue') : t('finish')}
        </button>
      </section>
    </div>
  );
}

function CreatePrefetch() {
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => {
    if (isLoaded && isSignedIn) prefetchCreateWorkspace(readLastCreateId());
  }, [isLoaded, isSignedIn]);
  return null;
}
