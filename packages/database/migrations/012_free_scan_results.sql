-- Public shareable free scan results
CREATE TABLE IF NOT EXISTS free_scan_results (
  id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
  domain text NOT NULL,
  pages_scanned integer NOT NULL DEFAULT 0,
  total_links_checked integer NOT NULL DEFAULT 0,
  total_affiliate_links integer NOT NULL DEFAULT 0,
  broken_links_count integer NOT NULL DEFAULT 0,
  broken_affiliate_count integer NOT NULL DEFAULT 0,
  estimated_monthly_loss numeric(10,2) NOT NULL DEFAULT 0,
  broken_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public read access (no auth required for viewing shared results)
ALTER TABLE free_scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scan results" ON free_scan_results FOR SELECT USING (true);

-- Auto-cleanup: index for finding old results
CREATE INDEX idx_free_scan_results_created ON free_scan_results(created_at);
