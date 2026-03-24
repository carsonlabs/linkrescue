-- Performance indexes for LinkRescue
-- Addresses audit report item #7: missing database indexes

-- Foreign key lookups (used on every dashboard load, scan dispatch, etc.)
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_site_id ON scans(site_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_pages_site_id ON pages(site_id);
CREATE INDEX IF NOT EXISTS idx_links_page_id ON links(page_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scan_id ON scan_events(scan_id);

-- Health scores: daily snapshots per site
CREATE INDEX IF NOT EXISTS idx_site_health_scores_site_id_date ON site_health_scores(site_id, date DESC);

-- Filtering indexes
CREATE INDEX IF NOT EXISTS idx_sites_verified_at ON sites(verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_issue_type ON scan_results(issue_type) WHERE issue_type != 'OK';

-- Cron job: find scans due for scheduling
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Guardian links per user
CREATE INDEX IF NOT EXISTS idx_guardian_links_user_id ON guardian_links(user_id);

-- API keys: prefix-based lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);

-- Webhook deliveries: find pending retries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status) WHERE status != 'delivered';

-- Stripe idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events(stripe_event_id);
