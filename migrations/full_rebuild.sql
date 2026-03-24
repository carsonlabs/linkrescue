-- ============================================================
-- LinkRescue Full Database Rebuild
-- Generated 2026-03-23
-- Run in Supabase SQL Editor in one shot
-- ============================================================

-- ============================================================
-- 001: INITIAL SCHEMA
-- ============================================================

-- Users table (managed by Supabase Auth)
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    billing_address jsonb,
    payment_method jsonb,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    stripe_price_id text,
    stripe_current_period_end timestamp with time zone
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Sites table
CREATE TABLE public.sites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain text NOT NULL,
    sitemap_url text,
    verify_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, domain)
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sites." ON public.sites FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sites_user_id ON public.sites(user_id);

-- Pages table
CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    url text NOT NULL,
    last_fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(site_id, url)
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pages on their own sites." ON public.pages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_pages_site_id ON public.pages(site_id);

-- Links table
CREATE TABLE public.links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    href text NOT NULL,
    is_affiliate boolean DEFAULT false NOT NULL,
    first_seen_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_id, href)
);
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage links on their own sites." ON public.links
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_links_page_id ON public.links(page_id);
CREATE INDEX idx_links_site_id ON public.links(site_id);

-- Scans table
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TABLE public.scans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    status scan_status DEFAULT 'pending' NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    pages_scanned integer DEFAULT 0 NOT NULL,
    links_checked integer DEFAULT 0 NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scans for their own sites." ON public.scans
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_scans_site_id ON public.scans(site_id);

-- Scan Results table
CREATE TYPE issue_type AS ENUM ('OK', 'BROKEN_4XX', 'SERVER_5XX', 'TIMEOUT', 'REDIRECT_TO_HOME', 'LOST_PARAMS');
CREATE TABLE public.scan_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    status_code integer,
    final_url text,
    redirect_hops integer DEFAULT 0 NOT NULL,
    issue_type issue_type DEFAULT 'OK' NOT NULL,
    checked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan results for their own sites." ON public.scan_results
  FOR ALL USING (auth.uid() = (
    SELECT s.user_id FROM public.sites s
    JOIN public.scans sc ON sc.site_id = s.id
    WHERE sc.id = scan_id
  ));
CREATE INDEX idx_scan_results_scan_id ON public.scan_results(scan_id);
CREATE INDEX idx_scan_results_link_id ON public.scan_results(link_id);
CREATE INDEX idx_scan_results_issue_type ON public.scan_results(issue_type);

-- Scan Events/Logs table
CREATE TABLE public.scan_events (
    id bigserial PRIMARY KEY,
    scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    level text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan events for their own sites." ON public.scan_events
  FOR ALL USING (auth.uid() = (
    SELECT s.user_id FROM public.sites s
    JOIN public.scans sc ON sc.site_id = s.id
    WHERE sc.id = scan_id
  ));
CREATE INDEX idx_scan_events_scan_id ON public.scan_events(scan_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- 002: FEATURE EXPANSION
-- ============================================================

CREATE TYPE org_role AS ENUM ('viewer', 'member', 'admin', 'owner');
CREATE TYPE guardian_status AS ENUM ('active', 'paused', 'broken');
CREATE TYPE match_status AS ENUM ('pending', 'applied', 'rejected');
CREATE TYPE redirect_status AS ENUM ('draft', 'pending_approval', 'approved', 'deployed', 'archived');
CREATE TYPE log_format AS ENUM ('nginx', 'apache', 'cloudflare', 'custom_json');
CREATE TYPE scan_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE webhook_event AS ENUM (
  'scan.completed', 'scan.failed', 'guardian.rescued', 'redirect.deployed', 'redirect.rollback'
);

-- Organizations (create table first, RLS policies added after org_members exists)
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Org Members (must exist before org_select policy references it)
CREATE TABLE org_members (
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'member',
  invited_by  UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- Now add RLS for both tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
    )
  );
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "org_delete" ON organizations
  FOR DELETE USING (owner_id = auth.uid());

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_select" ON org_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );
CREATE POLICY "org_members_insert" ON org_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );
CREATE POLICY "org_members_update" ON org_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );
CREATE POLICY "org_members_delete" ON org_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Guardian Links
CREATE TABLE guardian_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id                UUID REFERENCES organizations(id) ON DELETE SET NULL,
  slug                  TEXT NOT NULL UNIQUE,
  original_url          TEXT NOT NULL,
  backup_url            TEXT NOT NULL,
  status                guardian_status NOT NULL DEFAULT 'active',
  value_per_click_cents INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_links_select" ON guardian_links FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "guardian_links_insert" ON guardian_links FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "guardian_links_update" ON guardian_links FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "guardian_links_delete" ON guardian_links FOR DELETE USING (user_id = auth.uid());

-- Rescue Logs
CREATE TABLE rescue_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_link_id  UUID NOT NULL REFERENCES guardian_links(id) ON DELETE CASCADE,
  visitor_ip_hash   TEXT,
  rescued_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rescue_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rescue_logs_select" ON rescue_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guardian_links
      WHERE guardian_links.id = rescue_logs.guardian_link_id
        AND guardian_links.user_id = auth.uid()
    )
  );

-- Guardian Audit Log
CREATE TABLE guardian_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_link_id  UUID NOT NULL REFERENCES guardian_links(id) ON DELETE CASCADE,
  changed_by        UUID NOT NULL REFERENCES auth.users(id),
  field_name        TEXT NOT NULL,
  old_value         TEXT,
  new_value         TEXT,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE guardian_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian_audit_log_select" ON guardian_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guardian_links
      WHERE guardian_links.id = guardian_audit_log.guardian_link_id
        AND guardian_links.user_id = auth.uid()
    )
  );

-- Offers
CREATE TABLE offers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id                UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  url                   TEXT NOT NULL,
  topic                 TEXT NOT NULL DEFAULT '',
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  estimated_value_cents INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_select" ON offers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "offers_insert" ON offers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "offers_update" ON offers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "offers_delete" ON offers FOR DELETE USING (user_id = auth.uid());

-- Matches
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_result_id  UUID NOT NULL REFERENCES scan_results(id) ON DELETE CASCADE,
  offer_id        UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  match_score     SMALLINT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reason    TEXT NOT NULL DEFAULT '',
  status          match_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_select" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scan_results
        JOIN scans ON scans.id = scan_results.scan_id
        JOIN sites ON sites.id = scans.site_id
      WHERE scan_results.id = matches.scan_result_id
        AND sites.user_id = auth.uid()
    )
  );
CREATE POLICY "matches_insert" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_results
        JOIN scans ON scans.id = scan_results.scan_id
        JOIN sites ON sites.id = scans.site_id
      WHERE scan_results.id = matches.scan_result_id
        AND sites.user_id = auth.uid()
    )
  );
CREATE POLICY "matches_update" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM scan_results
        JOIN scans ON scans.id = scan_results.scan_id
        JOIN sites ON sites.id = scans.site_id
      WHERE scan_results.id = matches.scan_result_id
        AND sites.user_id = auth.uid()
    )
  );

-- Redirect Rules
CREATE TABLE redirect_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  from_url    TEXT NOT NULL,
  to_url      TEXT NOT NULL,
  status      redirect_status NOT NULL DEFAULT 'draft',
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, from_url)
);
ALTER TABLE redirect_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redirect_rules_select" ON redirect_rules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "redirect_rules_insert" ON redirect_rules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "redirect_rules_update" ON redirect_rules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "redirect_rules_delete" ON redirect_rules FOR DELETE USING (user_id = auth.uid());

-- Redirect Rule Versions
CREATE TABLE redirect_rule_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id     UUID NOT NULL REFERENCES redirect_rules(id) ON DELETE CASCADE,
  from_url    TEXT NOT NULL,
  to_url      TEXT NOT NULL,
  status      redirect_status NOT NULL,
  version     INTEGER NOT NULL,
  changed_by  UUID NOT NULL REFERENCES auth.users(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE redirect_rule_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redirect_rule_versions_select" ON redirect_rule_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM redirect_rules
      WHERE redirect_rules.id = redirect_rule_versions.rule_id
        AND redirect_rules.user_id = auth.uid()
    )
  );

-- Approval Log
CREATE TABLE approval_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id   UUID NOT NULL REFERENCES redirect_rules(id) ON DELETE CASCADE,
  action    TEXT NOT NULL,
  actor_id  UUID NOT NULL REFERENCES auth.users(id),
  note      TEXT,
  acted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_log_select" ON approval_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM redirect_rules
      WHERE redirect_rules.id = approval_log.rule_id
        AND redirect_rules.user_id = auth.uid()
    )
  );

-- Log Sources
CREATE TABLE log_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  format        log_format NOT NULL DEFAULT 'nginx',
  api_key_hash  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE log_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_sources_select" ON log_sources FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "log_sources_insert" ON log_sources FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "log_sources_update" ON log_sources FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "log_sources_delete" ON log_sources FOR DELETE USING (user_id = auth.uid());

-- Link Incidents
CREATE TABLE link_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID NOT NULL REFERENCES log_sources(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  source_page   TEXT,
  status_code   INTEGER NOT NULL,
  hits          INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, url)
);
ALTER TABLE link_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "link_incidents_select" ON link_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM log_sources
      WHERE log_sources.id = link_incidents.source_id
        AND log_sources.user_id = auth.uid()
    )
  );

-- Webhooks
CREATE TABLE webhooks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url                 TEXT NOT NULL,
  events              webhook_event[] NOT NULL DEFAULT '{}',
  secret              TEXT NOT NULL,
  last_triggered_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_select" ON webhooks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "webhooks_insert" ON webhooks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "webhooks_update" ON webhooks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "webhooks_delete" ON webhooks FOR DELETE USING (user_id = auth.uid());

-- Scan Schedules
CREATE TABLE scan_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  frequency   scan_frequency NOT NULL DEFAULT 'weekly',
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE scan_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_schedules_select" ON scan_schedules
  FOR SELECT USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = scan_schedules.site_id AND sites.user_id = auth.uid()));
CREATE POLICY "scan_schedules_insert" ON scan_schedules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = scan_schedules.site_id AND sites.user_id = auth.uid()));
CREATE POLICY "scan_schedules_update" ON scan_schedules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = scan_schedules.site_id AND sites.user_id = auth.uid()));
CREATE POLICY "scan_schedules_delete" ON scan_schedules
  FOR DELETE USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = scan_schedules.site_id AND sites.user_id = auth.uid()));

-- Revenue History
CREATE TABLE revenue_history (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                          DATE NOT NULL,
  total_revenue_lost_cents      INTEGER NOT NULL DEFAULT 0,
  total_revenue_recovered_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);
ALTER TABLE revenue_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_history_select" ON revenue_history FOR SELECT USING (user_id = auth.uid());

-- Recovered Sessions
CREATE TABLE recovered_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redirect_rule_id        UUID NOT NULL REFERENCES redirect_rules(id) ON DELETE CASCADE,
  session_fingerprint     TEXT NOT NULL,
  converted               BOOLEAN NOT NULL DEFAULT false,
  conversion_value_cents  INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE recovered_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recovered_sessions_select" ON recovered_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM redirect_rules
      WHERE redirect_rules.id = recovered_sessions.redirect_rule_id
        AND redirect_rules.user_id = auth.uid()
    )
  );

-- Email Leads
CREATE TABLE email_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  wizard_progress INTEGER NOT NULL DEFAULT 0,
  scan_id         UUID REFERENCES scans(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_leads_insert" ON email_leads FOR INSERT WITH CHECK (true);

-- Onboarding Events
CREATE TABLE onboarding_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES email_leads(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_events_insert" ON onboarding_events FOR INSERT WITH CHECK (true);


-- ============================================================
-- 003: HEALTH SCORES AND TRENDS
-- ============================================================

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

CREATE TABLE IF NOT EXISTS public.monthly_site_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  month date NOT NULL,
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


-- ============================================================
-- 003 SEED: AFFILIATE PROGRAMS
-- ============================================================

INSERT INTO public.affiliate_programs (name, domain, url_patterns, category) VALUES
  ('Amazon Associates', 'amazon.com', ARRAY['amzn.to', 'amazon.com/dp/', 'amazon.com/gp/'], 'marketplace'),
  ('ShareASale', 'shareasale.com', ARRAY['shareasale.com/r.cfm', 'shareasale.com/u.cfm'], 'network'),
  ('CJ Affiliate', 'cj.com', ARRAY['anrdoezrs.net', 'dpbolvw.net', 'jdoqocy.com', 'kqzyfj.com', 'tkqlhce.com'], 'network'),
  ('Impact', 'impact.com', ARRAY['sjv.io', 'pntra.com', 'pntrs.com', 'pntrac.com'], 'network'),
  ('Rakuten', 'rakuten.com', ARRAY['click.linksynergy.com', 'rakuten.com/shop/'], 'network'),
  ('ClickBank', 'clickbank.com', ARRAY['hop.clickbank.net', 'clickbank.net'], 'network'),
  ('Awin', 'awin.com', ARRAY['awin1.com', 'zenaps.com'], 'network'),
  ('FlexOffers', 'flexoffers.com', ARRAY['track.flexlinkspro.com'], 'network'),
  ('Partnerize', 'partnerize.com', ARRAY['prf.hn'], 'network'),
  ('eBay Partner Network', 'ebay.com', ARRAY['rover.ebay.com', 'ebay.us'], 'marketplace'),
  ('Walmart', 'walmart.com', ARRAY['goto.walmart.com'], 'marketplace'),
  ('Target', 'target.com', ARRAY['goto.target.com'], 'marketplace'),
  ('Shopify', 'shopify.com', ARRAY['shopify.pxf.io'], 'saas'),
  ('Bluehost', 'bluehost.com', ARRAY['bluehost.com/track/'], 'hosting'),
  ('SiteGround', 'siteground.com', ARRAY['siteground.com/go/'], 'hosting'),
  ('Hostinger', 'hostinger.com', ARRAY['hostinger.com?REFERRALCODE='], 'hosting'),
  ('NordVPN', 'nordvpn.com', ARRAY['go.nordvpn.net'], 'vpn'),
  ('ExpressVPN', 'expressvpn.com', ARRAY['expressvpn.com/order'], 'vpn'),
  ('Semrush', 'semrush.com', ARRAY['semrush.sjv.io', 'semrush.com/lp/'], 'seo'),
  ('Ahrefs', 'ahrefs.com', ARRAY['ahrefs.com/signup'], 'seo')
ON CONFLICT (domain) DO NOTHING;


-- ============================================================
-- 004: API KEYS, WEBHOOKS, SLACK
-- ============================================================

ALTER TYPE webhook_event ADD VALUE IF NOT EXISTS 'link.broken';
ALTER TYPE webhook_event ADD VALUE IF NOT EXISTS 'link.fixed';

CREATE TABLE public.api_keys (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          text NOT NULL,
    key_hash      text NOT NULL,
    key_prefix    text NOT NULL,
    last_used_at  timestamp with time zone,
    expires_at    timestamp with time zone,
    revoked_at    timestamp with time zone,
    created_at    timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.api_rate_limits (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    limit_type    text NOT NULL,
    window_start  timestamp with time zone NOT NULL,
    request_count integer DEFAULT 0 NOT NULL,
    updated_at    timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_api_rate_limits_lookup ON public.api_rate_limits(user_id, limit_type, window_start);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rate limits" ON public.api_rate_limits FOR SELECT USING (auth.uid() = user_id);

CREATE TYPE webhook_delivery_status AS ENUM ('pending', 'success', 'failed');
CREATE TABLE public.webhook_deliveries (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id      uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event           webhook_event NOT NULL,
    payload         jsonb NOT NULL,
    status          webhook_delivery_status DEFAULT 'pending' NOT NULL,
    status_code     integer,
    response_body   text,
    attempts        integer DEFAULT 0 NOT NULL,
    next_retry_at   timestamp with time zone,
    delivered_at    timestamp with time zone,
    created_at      timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(status, next_retry_at)
    WHERE status = 'pending' OR status = 'failed';
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own webhook deliveries" ON public.webhook_deliveries
    FOR SELECT USING (
        webhook_id IN (SELECT id FROM public.webhooks WHERE user_id = auth.uid())
    );

CREATE TABLE public.slack_integrations (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    webhook_url     text NOT NULL,
    channel_name    text,
    notify_broken   boolean DEFAULT true NOT NULL,
    notify_scan     boolean DEFAULT true NOT NULL,
    notify_weekly   boolean DEFAULT true NOT NULL,
    is_active       boolean DEFAULT true NOT NULL,
    created_at      timestamp with time zone DEFAULT now() NOT NULL,
    updated_at      timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_slack_per_user UNIQUE (user_id)
);
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own Slack integration" ON public.slack_integrations FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- 005: SEO PAGES
-- ============================================================

CREATE TYPE seo_page_type AS ENUM ('network_check', 'comparison', 'guide');
CREATE TYPE seo_page_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  page_type seo_page_type NOT NULL,
  status seo_page_status NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  meta_description text NOT NULL,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  hero_headline text,
  hero_subheadline text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  sidebar jsonb,
  faq jsonb,
  network_name text,
  network_url text,
  network_commission text,
  network_cookie_days integer,
  competitor_name text,
  competitor_url text,
  comparison_features jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_seo_pages_type_slug ON seo_pages (page_type, slug);
CREATE INDEX idx_seo_pages_status ON seo_pages (status) WHERE status = 'published';

CREATE OR REPLACE FUNCTION update_seo_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_pages_updated_at
  BEFORE UPDATE ON seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_pages_updated_at();

ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published SEO pages"
  ON seo_pages FOR SELECT
  USING (status = 'published');


-- ============================================================
-- 006: STRIPE IDEMPOTENCY
-- ============================================================

CREATE TABLE public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);
CREATE INDEX idx_stripe_events_event_id ON public.stripe_events(stripe_event_id);


-- ============================================================
-- 007 SEED: SEO PAGES
-- ============================================================

INSERT INTO public.seo_pages (
  slug, page_type, status, title, meta_description,
  og_title, og_description, canonical_url,
  hero_headline, hero_subheadline,
  content, faq,
  network_name, network_url, network_commission, network_cookie_days,
  published_at
) VALUES

-- 1. Amazon Associates
(
  'amazon-associates',
  'network_check',
  'published',
  'Amazon Associates Affiliate Link Checker | LinkRescue',
  'Free tool to check your Amazon Associates affiliate links for broken URLs, expired products, lost tracking tags, and redirect issues. Catch problems before they cost you commissions.',
  'Amazon Associates Affiliate Link Checker',
  'Scan your Amazon affiliate links for broken URLs, expired products, and lost tracking tags.',
  '/check/amazon-associates',
  'Check Your Amazon Associates Affiliate Links',
  'Amazon affiliate links break more often than any other network. Products get discontinued, URLs change, and tracking tags get stripped during redirects. Scan your site to find issues before they cost you commissions.',
  '[
    {"type": "heading", "heading": "Why Amazon Affiliate Links Break So Often"},
    {"type": "paragraph", "body": "Amazon Associates is the world''s largest affiliate program, but it also has one of the highest link rot rates. Our data shows that approximately 18% of Amazon affiliate links develop issues within 6 months."},
    {"type": "heading", "heading": "Common Amazon Affiliate Link Issues"},
    {"type": "list", "items": ["Product discontinued", "Out of stock", "Lost tracking tag", "URL structure change", "Geographic redirect"]},
    {"type": "heading", "heading": "How LinkRescue Monitors Amazon Links"},
    {"type": "paragraph", "body": "LinkRescue crawls your site on a schedule and specifically checks every Amazon affiliate link it finds."},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site to LinkRescue and run your first scan in under 60 seconds."}
  ]'::jsonb,
  '[
    {"q": "How long does an Amazon Associates link scan take?", "a": "A typical scan of 200 pages takes 2-5 minutes."},
    {"q": "Does LinkRescue check if my Amazon tag is still valid?", "a": "Yes. We verify that your associate tag is present in the final destination URL."},
    {"q": "How often do Amazon affiliate links break?", "a": "Approximately 15-20% develop issues within 6 months."},
    {"q": "Is LinkRescue free for Amazon Associates?", "a": "Yes! The free Starter plan lets you monitor 1 site with up to 200 pages scanned weekly."}
  ]'::jsonb,
  'Amazon Associates',
  'https://affiliate-program.amazon.com',
  '1-10% (varies by category)',
  1,
  now()
),

-- 2. ShareASale
(
  'shareasale',
  'network_check',
  'published',
  'ShareASale Affiliate Link Checker | LinkRescue',
  'Check your ShareASale affiliate links for broken URLs, expired merchant programs, and tracking issues.',
  'ShareASale Affiliate Link Checker',
  'Scan your ShareASale affiliate links for broken URLs and expired programs.',
  '/check/shareasale',
  'Check Your ShareASale Affiliate Links',
  'ShareASale hosts thousands of merchant programs, and links break when merchants leave the network.',
  '[
    {"type": "heading", "heading": "Why ShareASale Links Break"},
    {"type": "paragraph", "body": "ShareASale is one of the largest affiliate networks with 16,500+ merchant programs."},
    {"type": "heading", "heading": "How LinkRescue Monitors ShareASale Links"},
    {"type": "paragraph", "body": "LinkRescue identifies ShareASale affiliate links on your site and follows each one through the redirect chain."},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site and run a scan."}
  ]'::jsonb,
  '[
    {"q": "Does LinkRescue work with ShareASale custom tracking links?", "a": "Yes."},
    {"q": "How will I know when a ShareASale merchant closes?", "a": "LinkRescue checks your links on every scan and alerts you immediately."}
  ]'::jsonb,
  'ShareASale',
  'https://www.shareasale.com',
  'Varies by merchant (typically 5-30%)',
  30,
  now()
),

-- 3. CJ Affiliate
(
  'cj-affiliate',
  'network_check',
  'published',
  'CJ Affiliate Link Checker | LinkRescue',
  'Scan your site for broken CJ Affiliate links.',
  'CJ Affiliate Link Checker',
  'Find and fix broken CJ Affiliate links.',
  '/check/cj-affiliate',
  'Check Your CJ Affiliate Links',
  'CJ Affiliate powers links for major brands.',
  '[
    {"type": "heading", "heading": "Why CJ Affiliate Links Break"},
    {"type": "paragraph", "body": "CJ Affiliate connects publishers with enterprise-level advertisers."},
    {"type": "heading", "heading": "How LinkRescue Monitors CJ Links"},
    {"type": "paragraph", "body": "LinkRescue detects CJ Affiliate links on your pages and follows each through the full redirect chain."},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Sign up and add your site."}
  ]'::jsonb,
  '[
    {"q": "Which CJ tracking domains does LinkRescue detect?", "a": "All CJ tracking domains including anrdoezrs.net, tkqlhce.com, jdoqocy.com, kqzyfj.com, dpbolvw.net."}
  ]'::jsonb,
  'CJ Affiliate',
  'https://www.cj.com',
  'Varies by advertiser (typically 3-20%)',
  45,
  now()
),

-- 4. ClickBank
(
  'clickbank',
  'network_check',
  'published',
  'ClickBank Affiliate Link Checker | LinkRescue',
  'Check your ClickBank affiliate links for broken hoplinks and inactive products.',
  'ClickBank Affiliate Link Checker',
  'Scan your ClickBank hoplinks for broken or inactive product links.',
  '/check/clickbank',
  'Check Your ClickBank Affiliate Links',
  'ClickBank''s digital product marketplace has high vendor turnover.',
  '[
    {"type": "heading", "heading": "Why ClickBank Links Break"},
    {"type": "paragraph", "body": "ClickBank specializes in digital products with high turnover."},
    {"type": "heading", "heading": "How LinkRescue Monitors ClickBank Links"},
    {"type": "paragraph", "body": "LinkRescue identifies ClickBank hoplinks and verifies each one resolves to an active product."},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site to LinkRescue and run a scan."}
  ]'::jsonb,
  '[
    {"q": "Does LinkRescue support both old and new ClickBank link formats?", "a": "Yes."}
  ]'::jsonb,
  'ClickBank',
  'https://www.clickbank.com',
  '50-75% (digital products)',
  60,
  now()
),

-- 5. Impact
(
  'impact',
  'network_check',
  'published',
  'Impact.com Affiliate Link Checker | LinkRescue',
  'Scan your Impact.com affiliate links for broken tracking URLs and expired campaigns.',
  'Impact.com Affiliate Link Checker',
  'Find broken Impact.com affiliate links.',
  '/check/impact',
  'Check Your Impact.com Affiliate Links',
  'Impact.com powers affiliate programs for brands like Uber, Airbnb, Canva, and Shopify.',
  '[
    {"type": "heading", "heading": "Why Impact.com Links Break"},
    {"type": "paragraph", "body": "Impact.com is the fastest-growing affiliate platform."},
    {"type": "heading", "heading": "How LinkRescue Monitors Impact Links"},
    {"type": "paragraph", "body": "LinkRescue maintains a database of known Impact.com tracking domain patterns."},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Sign up and add your domain."}
  ]'::jsonb,
  '[
    {"q": "How does LinkRescue detect Impact.com links?", "a": "We maintain a database of known Impact tracking domain patterns."}
  ]'::jsonb,
  'Impact.com',
  'https://impact.com',
  'Varies by advertiser (typically 5-30%)',
  30,
  now()
)

ON CONFLICT (page_type, slug) DO NOTHING;

-- Comparison pages
INSERT INTO public.seo_pages (
  slug, page_type, status, title, meta_description,
  og_title, og_description, canonical_url,
  hero_headline, hero_subheadline,
  content, faq,
  competitor_name, competitor_url, comparison_features,
  published_at
) VALUES

-- 1. vs Screaming Frog
(
  'screaming-frog',
  'comparison',
  'published',
  'LinkRescue vs Screaming Frog | LinkRescue',
  'Comparing LinkRescue and Screaming Frog for affiliate link monitoring.',
  'LinkRescue vs Screaming Frog',
  'Which tool is better for monitoring affiliate links?',
  '/vs/screaming-frog',
  'LinkRescue vs Screaming Frog',
  'Screaming Frog is a powerful SEO crawler. LinkRescue is purpose-built for affiliate link monitoring.',
  '[
    {"type": "heading", "heading": "Different Tools for Different Jobs"},
    {"type": "paragraph", "body": "Screaming Frog is an excellent general-purpose SEO crawler. LinkRescue is specialized for affiliate marketers."}
  ]'::jsonb,
  '[
    {"q": "Is Screaming Frog free?", "a": "Free version limited to 500 URLs. Paid is $259/year."},
    {"q": "Can I use both?", "a": "Yes, and many affiliate marketers do."}
  ]'::jsonb,
  'Screaming Frog',
  'https://www.screamingfrog.co.uk',
  '[
    {"feature": "Purpose-built for affiliate links", "linkrescue": true, "competitor": false},
    {"feature": "Automated daily scans", "linkrescue": true, "competitor": false},
    {"feature": "General technical SEO audit", "linkrescue": false, "competitor": true},
    {"feature": "Free tier available", "linkrescue": true, "competitor": true},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "Free / $259/yr"}
  ]'::jsonb,
  now()
),

-- 2. vs Ahrefs
(
  'ahrefs',
  'comparison',
  'published',
  'LinkRescue vs Ahrefs for Affiliate Link Monitoring | LinkRescue',
  'How does LinkRescue compare to Ahrefs for monitoring affiliate links?',
  'LinkRescue vs Ahrefs for Affiliate Links',
  'Compare LinkRescue and Ahrefs for affiliate link monitoring.',
  '/vs/ahrefs',
  'LinkRescue vs Ahrefs',
  'Ahrefs is a comprehensive SEO platform. LinkRescue focuses exclusively on affiliate link health.',
  '[
    {"type": "heading", "heading": "Ahrefs: The SEO Swiss Army Knife"},
    {"type": "paragraph", "body": "Ahrefs is one of the most powerful SEO tools available. However, it is not specifically for affiliate marketers."}
  ]'::jsonb,
  '[
    {"q": "Should I cancel Ahrefs?", "a": "Not necessarily. They serve different purposes."},
    {"q": "Is LinkRescue cheaper than Ahrefs?", "a": "Yes. $29/month vs $99/month."}
  ]'::jsonb,
  'Ahrefs',
  'https://ahrefs.com',
  '[
    {"feature": "Purpose-built for affiliate links", "linkrescue": true, "competitor": false},
    {"feature": "Tracking parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Keyword research", "linkrescue": false, "competitor": true},
    {"feature": "Backlink analysis", "linkrescue": false, "competitor": true},
    {"feature": "Free tier", "linkrescue": true, "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "$99/mo"}
  ]'::jsonb,
  now()
)

ON CONFLICT (page_type, slug) DO NOTHING;


-- ============================================================
-- 008: EMAIL SEQUENCE LOG
-- ============================================================

CREATE TABLE public.email_sequence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_key text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_key)
);
CREATE INDEX idx_email_sequence_user ON public.email_sequence_log(user_id);
ALTER TABLE public.email_sequence_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 009: PHASE 2 PRODUCTION READINESS
-- ============================================================

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS scan_summary jsonb;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS crawl_exclusions text[] DEFAULT '{}' NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_finished_at ON public.scans(finished_at) WHERE finished_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_status_started ON public.scans(status, started_at) WHERE status = 'running';


-- ============================================================
-- 010: PHASE 3 SCALE READINESS
-- ============================================================

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS dispatch_key text UNIQUE;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS trigger_source text;
CREATE INDEX IF NOT EXISTS idx_scans_dispatch_key ON public.scans(dispatch_key) WHERE dispatch_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_site_active ON public.scans(site_id, status) WHERE status IN ('pending', 'running');


-- ============================================================
-- STANDALONE: MVP EXTRAS (scan_issues + monthly crawl limits)
-- These come from the original MVP migrations folder
-- ============================================================

-- scan_issues table (used by the app alongside scan_results)
CREATE TABLE IF NOT EXISTS public.scan_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid REFERENCES public.scans(id) ON DELETE CASCADE NOT NULL,
  page_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('broken', 'redirect', 'timeout', 'lost_params')),
  http_status INTEGER,
  affiliate_network TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view issues for own scans"
  ON public.scan_issues FOR SELECT
  USING (
    scan_id IN (
      SELECT s.id FROM public.scans s
      JOIN public.sites si ON s.site_id = si.id
      WHERE si.user_id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_scan_issues_scan_id ON public.scan_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_issues_issue_type ON public.scan_issues(issue_type);

-- Monthly crawl limit tracking on users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS monthly_pages_crawled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_crawled_reset_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_pages_crawled_reset
ON public.users(pages_crawled_reset_at)
WHERE pages_crawled_reset_at IS NOT NULL;

CREATE OR REPLACE FUNCTION increment_monthly_pages_crawled(
  user_id uuid,
  pages integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET monthly_pages_crawled = COALESCE(monthly_pages_crawled, 0) + pages
  WHERE id = user_id;
END;
$$;

COMMENT ON COLUMN public.users.monthly_pages_crawled IS 'Total pages crawled this month across all sites';
COMMENT ON COLUMN public.users.pages_crawled_reset_at IS 'Timestamp when monthly_pages_crawled was last reset';


-- ============================================================
-- DONE. All LinkRescue tables, RLS, indexes, seeds, and functions created.
-- ============================================================
