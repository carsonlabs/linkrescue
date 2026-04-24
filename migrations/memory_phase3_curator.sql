-- ============================================================
-- Memory Phase 3: Curator Managed Agent
-- Adds per-user memory store pointer so the Curator agent can
-- pick up prior insights on each weekly run.
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS curator_memory_store_id text,
  ADD COLUMN IF NOT EXISTS curator_last_run_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_curator_last_run
  ON public.users (curator_last_run_at)
  WHERE curator_memory_store_id IS NOT NULL;

COMMENT ON COLUMN public.users.curator_memory_store_id IS 'Anthropic Memory Store ID that the Curator agent reads/writes to for this user. NULL until the first curator run provisions one.';
COMMENT ON COLUMN public.users.curator_last_run_at IS 'Timestamp of the last successful curator session for this user.';

-- Insights the curator agent surfaces back to the app (lightweight, displayed
-- in a dashboard panel). The memory store holds the agent's private notes;
-- this table holds the user-facing summary the agent publishes.
CREATE TABLE IF NOT EXISTS public.curator_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('summary', 'recommendation', 'alert_suppression', 'program_risk')),
  headline      text NOT NULL,
  body          text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curator_insights_user_active
  ON public.curator_insights (user_id, created_at DESC)
  WHERE dismissed_at IS NULL;

ALTER TABLE public.curator_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own curator insights"
  ON public.curator_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users dismiss own curator insights"
  ON public.curator_insights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
