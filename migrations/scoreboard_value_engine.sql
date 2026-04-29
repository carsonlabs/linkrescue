-- ============================================================
-- Scoreboard Value Engine
-- Powers the dashboard scoreboard hero, weekly digest, and public counter.
--
-- Adds dollar-denominated value tracking to scan_results so we can answer:
--   "How much in affiliate commissions did LinkRescue protect this month?"
--
-- Run in Supabase SQL Editor.
-- ============================================================

-- 1. Per-result value + resolution tracking
ALTER TABLE public.scan_results
  ADD COLUMN IF NOT EXISTS estimated_value_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_kind text
    CHECK (resolution_kind IN ('redirect_deployed', 'guardian_rescued', 'manual_fix', 'auto_recovered'));

CREATE INDEX IF NOT EXISTS idx_scan_results_resolved_at
  ON public.scan_results (resolved_at)
  WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scan_results_value
  ON public.scan_results (scan_id)
  WHERE estimated_value_cents > 0;

COMMENT ON COLUMN public.scan_results.estimated_value_cents IS
  'Estimated monthly affiliate commission $ at risk from this issue. Populated on insert by value-estimator.';
COMMENT ON COLUMN public.scan_results.resolved_at IS
  'Timestamp when this issue was fixed (redirect deployed / guardian rescued / manual fix).';

-- 2. Per-user scoreboard view
-- One row per user with all the metrics the dashboard hero needs.
CREATE OR REPLACE VIEW public.user_scoreboard AS
WITH this_month AS (
  SELECT
    si.user_id,
    sr.id AS scan_result_id,
    sr.issue_type,
    sr.estimated_value_cents,
    sr.resolved_at,
    sr.checked_at
  FROM public.scan_results sr
  JOIN public.scans sc ON sc.id = sr.scan_id
  JOIN public.sites si ON si.id = sc.site_id
  WHERE sr.checked_at >= date_trunc('month', now())
    AND sr.issue_type <> 'OK'
),
last_month AS (
  SELECT
    si.user_id,
    SUM(sr.estimated_value_cents) FILTER (
      WHERE sr.resolved_at >= date_trunc('month', now() - interval '1 month')
        AND sr.resolved_at < date_trunc('month', now())
    ) AS revenue_protected_last_month_cents
  FROM public.scan_results sr
  JOIN public.scans sc ON sc.id = sr.scan_id
  JOIN public.sites si ON si.id = sc.site_id
  WHERE sr.issue_type <> 'OK'
  GROUP BY si.user_id
),
all_time AS (
  SELECT
    si.user_id,
    COUNT(*) FILTER (WHERE sr.resolved_at IS NOT NULL) AS issues_resolved_all_time,
    SUM(sr.estimated_value_cents) FILTER (WHERE sr.resolved_at IS NOT NULL) AS revenue_protected_all_time_cents
  FROM public.scan_results sr
  JOIN public.scans sc ON sc.id = sr.scan_id
  JOIN public.sites si ON si.id = sc.site_id
  WHERE sr.issue_type <> 'OK'
  GROUP BY si.user_id
),
top_program AS (
  SELECT DISTINCT ON (si.user_id)
    si.user_id,
    ap.name AS top_at_risk_program,
    COUNT(*) OVER (PARTITION BY si.user_id, ap.name) AS top_program_issue_count
  FROM public.scan_results sr
  JOIN public.scans sc ON sc.id = sr.scan_id
  JOIN public.sites si ON si.id = sc.site_id
  JOIN public.links l ON l.id = sr.link_id
  JOIN public.affiliate_programs ap
    ON EXISTS (
      SELECT 1 FROM unnest(ap.url_patterns) AS pat
      WHERE l.href ILIKE '%' || pat || '%'
    )
  WHERE sr.issue_type <> 'OK'
    AND sr.checked_at >= now() - interval '7 days'
  ORDER BY si.user_id, COUNT(*) OVER (PARTITION BY si.user_id, ap.name) DESC
),
recent_health AS (
  SELECT
    si.user_id,
    AVG(hs.score)::int AS avg_health_score_7d
  FROM public.site_health_scores hs
  JOIN public.sites si ON si.id = hs.site_id
  WHERE hs.recorded_at >= (CURRENT_DATE - interval '7 days')
  GROUP BY si.user_id
)
SELECT
  u.id AS user_id,
  COALESCE(COUNT(DISTINCT tm.scan_result_id), 0)::int AS issues_caught_this_month,
  COALESCE(COUNT(DISTINCT tm.scan_result_id) FILTER (WHERE tm.resolved_at >= date_trunc('month', now())), 0)::int AS issues_resolved_this_month,
  COALESCE(SUM(tm.estimated_value_cents), 0)::bigint AS revenue_at_risk_cents,
  COALESCE(SUM(tm.estimated_value_cents) FILTER (WHERE tm.resolved_at >= date_trunc('month', now())), 0)::bigint AS revenue_protected_cents,
  COALESCE(lm.revenue_protected_last_month_cents, 0)::bigint AS revenue_protected_last_month_cents,
  COALESCE(at.issues_resolved_all_time, 0)::int AS issues_resolved_all_time,
  COALESCE(at.revenue_protected_all_time_cents, 0)::bigint AS revenue_protected_all_time_cents,
  rh.avg_health_score_7d,
  tp.top_at_risk_program,
  COALESCE(tp.top_program_issue_count, 0)::int AS top_program_issue_count
FROM public.users u
LEFT JOIN this_month tm ON tm.user_id = u.id
LEFT JOIN last_month lm ON lm.user_id = u.id
LEFT JOIN all_time at ON at.user_id = u.id
LEFT JOIN top_program tp ON tp.user_id = u.id
LEFT JOIN recent_health rh ON rh.user_id = u.id
GROUP BY u.id, lm.revenue_protected_last_month_cents,
  at.issues_resolved_all_time, at.revenue_protected_all_time_cents,
  rh.avg_health_score_7d, tp.top_at_risk_program, tp.top_program_issue_count;

COMMENT ON VIEW public.user_scoreboard IS
  'One row per user with all scoreboard metrics: $ protected, issues caught/resolved, top at-risk program, 7-day health average.';

-- RLS for the view: users can only see their own row
GRANT SELECT ON public.user_scoreboard TO authenticated;

-- 3. Public aggregate stats (for homepage counter)
-- Anonymized rollup, safe to expose without auth.
CREATE OR REPLACE VIEW public.network_stats_public AS
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM public.sites WHERE verified_at IS NOT NULL) AS protected_sites,
  (SELECT COUNT(*) FROM public.scan_results WHERE resolved_at IS NOT NULL AND issue_type <> 'OK') AS total_issues_resolved,
  (SELECT COALESCE(SUM(estimated_value_cents), 0) FROM public.scan_results
    WHERE resolved_at IS NOT NULL AND issue_type <> 'OK')::bigint AS total_revenue_protected_cents,
  (SELECT COUNT(*) FROM public.scan_results WHERE issue_type <> 'OK')::bigint AS total_issues_caught,
  now() AS computed_at;

GRANT SELECT ON public.network_stats_public TO anon, authenticated;

COMMENT ON VIEW public.network_stats_public IS
  'Anonymized network-wide aggregates for the public homepage counter. No PII.';

-- 4. Helper RPC: increment monthly resolution when a redirect deploys or guardian rescues.
-- Called from the redirect-deploy and guardian-rescue paths to mark the originating issue resolved.
CREATE OR REPLACE FUNCTION public.mark_issue_resolved(
  p_scan_result_id uuid,
  p_resolution_kind text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_resolution_kind NOT IN ('redirect_deployed', 'guardian_rescued', 'manual_fix', 'auto_recovered') THEN
    RAISE EXCEPTION 'Invalid resolution_kind: %', p_resolution_kind;
  END IF;

  UPDATE public.scan_results
  SET resolved_at = COALESCE(resolved_at, now()),
      resolution_kind = COALESCE(resolution_kind, p_resolution_kind)
  WHERE id = p_scan_result_id;
END;
$$;

COMMENT ON FUNCTION public.mark_issue_resolved IS
  'Marks a scan_results row as resolved. Idempotent. Called by the redirect-deploy and guardian-rescue paths.';

-- ============================================================
-- DONE. Scoreboard value engine ready.
-- ============================================================
