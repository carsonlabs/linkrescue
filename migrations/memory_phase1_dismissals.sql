-- ============================================================
-- Memory Phase 1: Issue Dismissals
-- Lets users say "ignore this" (single link) or "ignore similar"
-- (pattern by host). Suppresses alerts and hides from issues
-- list until explicitly restored.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.issue_dismissals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id       uuid REFERENCES public.links(id) ON DELETE CASCADE,
  pattern_host  text,
  issue_type    issue_type,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issue_dismissals_target_check CHECK (
    (link_id IS NOT NULL AND pattern_host IS NULL)
    OR (link_id IS NULL AND pattern_host IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_issue_dismissals_user_link
  ON public.issue_dismissals (user_id, link_id)
  WHERE link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_issue_dismissals_user_host
  ON public.issue_dismissals (user_id, pattern_host)
  WHERE pattern_host IS NOT NULL;

-- NULLS NOT DISTINCT (Postgres 15+) treats NULL issue_types as equal so a
-- "dismiss all types" row stays unique per target. Avoids the IMMUTABLE
-- function trap you hit with COALESCE(enum::text) inside an index expression.
CREATE UNIQUE INDEX IF NOT EXISTS idx_issue_dismissals_unique_link
  ON public.issue_dismissals (user_id, link_id, issue_type)
  NULLS NOT DISTINCT
  WHERE link_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_issue_dismissals_unique_host
  ON public.issue_dismissals (user_id, pattern_host, issue_type)
  NULLS NOT DISTINCT
  WHERE pattern_host IS NOT NULL;

ALTER TABLE public.issue_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissals"
  ON public.issue_dismissals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.issue_dismissals IS 'Per-user suppression rules — the memory substrate. Single link or host pattern, optionally scoped to one issue type.';
COMMENT ON COLUMN public.issue_dismissals.pattern_host IS 'Host matched against url host of link.href (exact match, lowercased).';
COMMENT ON COLUMN public.issue_dismissals.issue_type IS 'NULL = dismiss all issue types for this target; otherwise scoped to one type.';
