-- ============================================================
-- Migration 002: Feature Expansion
-- LinkRescue - Orgs, Guardian, Offers, Matches, Redirect Rules,
--              Monitoring, Webhooks, Schedules, Analytics, Onboarding
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE org_role AS ENUM ('viewer', 'member', 'admin', 'owner');
CREATE TYPE guardian_status AS ENUM ('active', 'paused', 'broken');
CREATE TYPE match_status AS ENUM ('pending', 'applied', 'rejected');
CREATE TYPE redirect_status AS ENUM ('draft', 'pending_approval', 'approved', 'deployed', 'archived');
CREATE TYPE log_format AS ENUM ('nginx', 'apache', 'cloudflare', 'custom_json');
CREATE TYPE scan_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE webhook_event AS ENUM (
  'scan.completed', 'scan.failed', 'guardian.rescued', 'redirect.deployed', 'redirect.rollback'
);

-- ── Organizations ─────────────────────────────────────────────

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ── Org Members ───────────────────────────────────────────────

CREATE TABLE org_members (
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'member',
  invited_by  UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

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

-- ── Guardian Links ────────────────────────────────────────────

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

CREATE POLICY "guardian_links_select" ON guardian_links
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "guardian_links_insert" ON guardian_links
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "guardian_links_update" ON guardian_links
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "guardian_links_delete" ON guardian_links
  FOR DELETE USING (user_id = auth.uid());

-- ── Rescue Logs ───────────────────────────────────────────────

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

-- Inserts are service-role only (fire-and-forget from public endpoint)

-- ── Guardian Audit Log ────────────────────────────────────────

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

-- ── Offers ────────────────────────────────────────────────────

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

CREATE POLICY "offers_select" ON offers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "offers_insert" ON offers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "offers_update" ON offers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "offers_delete" ON offers
  FOR DELETE USING (user_id = auth.uid());

-- ── Matches ───────────────────────────────────────────────────

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

-- ── Redirect Rules ────────────────────────────────────────────

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

CREATE POLICY "redirect_rules_select" ON redirect_rules
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "redirect_rules_insert" ON redirect_rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "redirect_rules_update" ON redirect_rules
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "redirect_rules_delete" ON redirect_rules
  FOR DELETE USING (user_id = auth.uid());

-- ── Redirect Rule Versions ────────────────────────────────────

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

-- ── Approval Log ─────────────────────────────────────────────

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

-- ── Log Sources ───────────────────────────────────────────────

CREATE TABLE log_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  format        log_format NOT NULL DEFAULT 'nginx',
  api_key_hash  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE log_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_sources_select" ON log_sources
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "log_sources_insert" ON log_sources
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "log_sources_update" ON log_sources
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "log_sources_delete" ON log_sources
  FOR DELETE USING (user_id = auth.uid());

-- ── Link Incidents ────────────────────────────────────────────

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

-- ── Webhooks ──────────────────────────────────────────────────

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

CREATE POLICY "webhooks_select" ON webhooks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "webhooks_insert" ON webhooks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "webhooks_update" ON webhooks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "webhooks_delete" ON webhooks
  FOR DELETE USING (user_id = auth.uid());

-- ── Scan Schedules ────────────────────────────────────────────

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
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scan_schedules.site_id
        AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "scan_schedules_insert" ON scan_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scan_schedules.site_id
        AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "scan_schedules_update" ON scan_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scan_schedules.site_id
        AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "scan_schedules_delete" ON scan_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = scan_schedules.site_id
        AND sites.user_id = auth.uid()
    )
  );

-- ── Revenue History ───────────────────────────────────────────

CREATE TABLE revenue_history (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                          DATE NOT NULL,
  total_revenue_lost_cents      INTEGER NOT NULL DEFAULT 0,
  total_revenue_recovered_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE revenue_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_history_select" ON revenue_history
  FOR SELECT USING (user_id = auth.uid());

-- ── Recovered Sessions ────────────────────────────────────────

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

-- ── Email Leads ───────────────────────────────────────────────

CREATE TABLE email_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  wizard_progress INTEGER NOT NULL DEFAULT 0,
  scan_id         UUID REFERENCES scans(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Public insert only (wizard runs without auth)
CREATE POLICY "email_leads_insert" ON email_leads
  FOR INSERT WITH CHECK (true);

-- Reads are service-role only

-- ── Onboarding Events ─────────────────────────────────────────

CREATE TABLE onboarding_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES email_leads(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_events_insert" ON onboarding_events
  FOR INSERT WITH CHECK (true);

-- Reads are service-role only
