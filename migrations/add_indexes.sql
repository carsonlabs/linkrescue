-- Additional performance indexes for LinkRescue
-- Run AFTER full_rebuild.sql — these add indexes not already in the base schema

-- Partial index: only verified sites (speeds up cron scan dispatch)
CREATE INDEX IF NOT EXISTS idx_sites_verified_at ON sites(verified_at) WHERE verified_at IS NOT NULL;

-- Scans: created_at for dashboard ordering
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Health scores: composite for time-series queries (DESC for recent-first)
CREATE INDEX IF NOT EXISTS idx_site_health_scores_site_id_date ON site_health_scores(site_id, recorded_at DESC);

-- Guardian links per user (for dashboard list)
CREATE INDEX IF NOT EXISTS idx_guardian_links_user_id ON guardian_links(user_id);

-- Webhook deliveries: find pending retries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_pending ON webhook_deliveries(status) WHERE status != 'delivered';

-- Stripe events: recent lookups
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at ON stripe_events(processed_at DESC);
