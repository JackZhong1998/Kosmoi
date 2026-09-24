-- Spark Story Studio schema
-- Clerk is the identity source. Next.js API routes use the Supabase service role.
-- Anon/authenticated clients have no policies, so RLS denies all direct access.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- profiles: local projection of a Clerk user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  reader_gender TEXT NOT NULL DEFAULT 'all' CHECK (reader_gender IN ('female', 'male', 'all')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions / stripe_events: from NowBuild SaaS Kit, plus billing_cycle
-- Default free+active so generation is not gated yet.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  billing_cycle TEXT CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'yearly')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- stories: author's working copy (StoryProject)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '未命名故事',
  topic_title TEXT NOT NULL DEFAULT '',
  audience TEXT CHECK (audience IS NULL OR audience IN ('female', 'male', 'neutral')),
  tag_path TEXT[] NOT NULL DEFAULT '{}',
  topic_doc TEXT NOT NULL DEFAULT '',
  design_doc TEXT NOT NULL DEFAULT '',
  chapters_doc TEXT NOT NULL DEFAULT '',
  style_doc TEXT NOT NULL DEFAULT '',
  style_name TEXT NOT NULL DEFAULT '',
  prose_doc TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  recommendation_gender TEXT NOT NULL DEFAULT 'all' CHECK (recommendation_gender IN ('female', 'male', 'all')),
  recommendation_tags TEXT[] NOT NULL DEFAULT '{}',
  recommendation_summary TEXT NOT NULL DEFAULT '',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_user_updated
  ON public.stories(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS stories_updated_at ON public.stories;
CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- publications: public snapshot. Unpublish by status, do not delete the row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL UNIQUE REFERENCES public.stories(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'unpublished')),
  title TEXT NOT NULL,
  logline TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  chapter TEXT NOT NULL DEFAULT '序章',
  word_count INTEGER NOT NULL DEFAULT 0,
  audience TEXT CHECK (audience IS NULL OR audience IN ('female', 'male', 'neutral')),
  tag_path TEXT[] NOT NULL DEFAULT '{}',
  topic_doc TEXT NOT NULL DEFAULT '',
  design_doc TEXT NOT NULL DEFAULT '',
  chapters_doc TEXT NOT NULL DEFAULT '',
  style_doc TEXT NOT NULL DEFAULT '',
  prose_doc TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publications_feed
  ON public.publications(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_publications_author
  ON public.publications(author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_publications_discovery
  ON public.publications(status, language, recommendation_gender, published_at DESC);

-- Safe upgrades for databases created before preferences and recommendations.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reader_gender TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS recommendation_gender TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS recommendation_tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS recommendation_summary TEXT NOT NULL DEFAULT '';

DROP TRIGGER IF EXISTS publications_updated_at ON public.publications;
CREATE TRIGGER publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- reading_progress: signed-in play state for a publication
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  chapter TEXT NOT NULL DEFAULT '',
  node_id TEXT,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  path JSONB NOT NULL DEFAULT '[]'::jsonb,
  explored JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, publication_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user
  ON public.reading_progress(user_id, read_at DESC);

-- ---------------------------------------------------------------------------
-- ai_usage: reserved for later quotas; the app does not write this yet
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user
  ON public.ai_usage(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security: deny anon/authenticated; service_role bypasses RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage stripe events" ON public.stripe_events;
DROP POLICY IF EXISTS "Service role can manage stories" ON public.stories;
DROP POLICY IF EXISTS "Service role can manage publications" ON public.publications;
DROP POLICY IF EXISTS "Service role can manage reading progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Service role can manage ai usage" ON public.ai_usage;

CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage stripe events"
  ON public.stripe_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage stories"
  ON public.stories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage publications"
  ON public.publications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage reading progress"
  ON public.reading_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage ai usage"
  ON public.ai_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
