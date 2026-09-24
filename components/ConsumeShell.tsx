'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { prefetchCreateWorkspace } from '@/lib/create-workspace';
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

type UserPreferences = { language: Locale; gender: ReaderGender; completed: boolean };
type PreferencesValue = {
  preferences: UserPreferences;
  savePreferences: (next: UserPreferences) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside ConsumeShell');
  return value;
}

export function ConsumeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferenceError, setPreferenceError] = useState('');

  const nav = [
    { href: '/', label: t('home'), Icon: IconHome },
    { href: '/create', label: t('create'), Icon: IconCreate },
    { href: '/me', label: t('me'), Icon: IconMe },
  ] as const;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(pathname || '/')}`);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    let hasCachedPreferences = false;
    const cacheKey = userId ? `spark-preferences:${userId}` : '';
    if (cacheKey) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null') as UserPreferences | null;
        if (cached?.language && cached?.gender) {
          hasCachedPreferences = true;
          setPreferences(cached);
          setLocale(cached.language);
        }
      } catch {
        /* stale preference cache */
      }
    }
    apiJson<UserPreferences>('/api/preferences')
      .then((data) => {
        if (cancelled) return;
        setPreferences(data);
        setLocale(data.language);
        if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch((err) => {
        if (!cancelled && !hasCachedPreferences) setPreferenceError(err instanceof Error ? err.message : 'Unable to load preferences');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, setLocale, userId]);

  async function savePreferences(next: { language: Locale; gender: ReaderGender; completed: boolean }) {
    setPreferenceError('');
    setLocale(next.language);
    const saved = await apiJson<UserPreferences>('/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify(next),
    });
    setPreferences(saved);
    if (userId) sessionStorage.setItem(`spark-preferences:${userId}`, JSON.stringify(saved));
  }

  if (!isLoaded || (isSignedIn && !preferences && !preferenceError)) {
    return <div className="consume-empty"><p>{locale === 'zh' ? '正在准备火花…' : 'Preparing Spark…'}</p></div>;
  }

  if (!isSignedIn) return null;

  return (
    <PreferencesContext.Provider value={{ preferences: preferences!, savePreferences }}>
    <div className="consume">
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <CreatePrefetch /> : null}
      <nav className="consume-nav" aria-label={locale === 'zh' ? '主导航' : 'Main navigation'}>
        {nav.map((item) => {
          const href = item.href;
          const on = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`consume-nav-item${on ? ' on' : ''}`}
              onMouseEnter={() => {
                if (item.href === '/create') prefetchCreateWorkspace();
              }}
              onTouchStart={() => {
                if (item.href === '/create') prefetchCreateWorkspace();
              }}
            >
              <item.Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <main className="consume-main">{children}</main>
      {preferences && !preferences.completed ? (
        <Onboarding
          initial={preferences}
          error={preferenceError}
          onLanguage={setLocale}
          onFinish={savePreferences}
        />
      ) : null}
    </div>
    </PreferencesContext.Provider>
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
    if (isLoaded && isSignedIn) prefetchCreateWorkspace();
  }, [isLoaded, isSignedIn]);
  return null;
}
