-- Phase 2: Anti-Churn Engine — Health Scores, Trends, and Network Intelligence

-- 2.1: Site Health Scores (daily snapshots)
CREATE TABLE IF NOT EXISTS public.site_health_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score >= 0 AND score <= 100),
  healthy_link_ratio numeric(5,4) NOT NULL DEFAULT 0,
  scan_coverage numeric(5,4) NOT NULL DEFAULT 0,
  days_since_critical integer NOT NULL DEFAULT 0,
  affiliate_param_integrity numeric(5,4) NOT NULL DEFAULT 0,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_health_scores_site_date ON public.site_health_scores(site_id, recorded_at);
CREATE INDEX idx_health_scores_site_id ON public.site_health_scores(site_id);
CREATE INDEX idx_health_scores_recorded_at ON public.site_health_scores(recorded_at);

ALTER TABLE public.site_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view health scores for their own sites"
  ON public.site_health_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites WHERE sites.id = site_health_scores.site_id AND sites.user_id = auth.uid()
  ));

-- 2.3: Monthly aggregated stats for trend charts
CREATE TABLE IF NOT EXISTS public.monthly_site_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  month date NOT NULL, -- first day of the month
  total_links_checked integer NOT NULL DEFAULT 0,
  total_issues_found integer NOT NULL DEFAULT 0,
  total_issues_resolved integer NOT NULL DEFAULT 0,
  broken_link_count integer NOT NULL DEFAULT 0,
  affiliate_issues_count integer NOT NULL DEFAULT 0,
  pages_scanned integer NOT NULL DEFAULT 0,
  scans_completed integer NOT NULL DEFAULT 0,
  avg_health_score smallint DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_monthly_stats_site_month ON public.monthly_site_stats(site_id, month);
CREATE INDEX idx_monthly_stats_site_id ON public.monthly_site_stats(site_id);

ALTER TABLE public.monthly_site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view monthly stats for their own sites"
  ON public.monthly_site_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites WHERE sites.id = monthly_site_stats.site_id AND sites.user_id = auth.uid()
  ));

-- 2.4: Network Intelligence Schema
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  url_patterns text[] NOT NULL DEFAULT '{}',
  category text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_programs_domain ON public.affiliate_programs(domain);

CREATE TABLE IF NOT EXISTS public.program_health (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_links_checked integer NOT NULL DEFAULT 0,
  broken_count integer NOT NULL DEFAULT 0,
  rot_rate numeric(5,4) NOT NULL DEFAULT 0,
  avg_response_time_ms integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_program_health_program_month ON public.program_health(program_id, month);

CREATE TABLE IF NOT EXISTS public.network_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('spike', 'outage', 'deprecation', 'pattern_change')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  resolved_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_network_alerts_program ON public.network_alerts(program_id);
CREATE INDEX idx_network_alerts_created ON public.network_alerts(created_at);

-- Basic aggregation view for program health
CREATE OR REPLACE VIEW public.program_health_summary AS
SELECT
  ap.id AS program_id,
  ap.name,
  ap.domain,
  ap.category,
  ph.month,
  ph.total_links_checked,
  ph.broken_count,
  ph.rot_rate,
  CASE
    WHEN ph.rot_rate > 0.1 THEN 'critical'
    WHEN ph.rot_rate > 0.05 THEN 'warning'
    ELSE 'healthy'
  END AS status
FROM public.affiliate_programs ap
LEFT JOIN public.program_health ph ON ph.program_id = ap.id
ORDER BY ph.month DESC, ph.rot_rate DESC;
