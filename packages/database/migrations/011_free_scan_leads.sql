-- Extend free_scan_leads table with scan result columns
-- The base table was created in migrations/free_scan_leads.sql with:
--   id, email, site_url, source, referrer, created_at

-- Add columns for storing scan results and conversion tracking
ALTER TABLE free_scan_leads
  ADD COLUMN IF NOT EXISTS broken_links_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affiliate_issues_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_loss numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS converted_to_signup boolean DEFAULT false;
