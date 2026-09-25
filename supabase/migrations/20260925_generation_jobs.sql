-- Apply this migration before deploying the background generation routes.
CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('single', 'auto', 'structure')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error', 'canceled')),
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output TEXT NOT NULL DEFAULT '',
  thinking TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  round INTEGER NOT NULL DEFAULT 0,
  cancel_requested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generation_jobs_one_active_story
  ON public.generation_jobs(story_id) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_story
  ON public.generation_jobs(user_id, story_id, created_at DESC);
DROP TRIGGER IF EXISTS generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage generation jobs" ON public.generation_jobs;
CREATE POLICY "Service role can manage generation jobs"
  ON public.generation_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
