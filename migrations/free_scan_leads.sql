-- Free scan lead capture table
-- Stores leads from link-checker and other free tools for follow-up

CREATE TABLE IF NOT EXISTS free_scan_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  site_url TEXT,
  source TEXT NOT NULL DEFAULT 'link-checker',
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for dedup and lookups
CREATE INDEX IF NOT EXISTS idx_free_scan_leads_email ON free_scan_leads(email);
CREATE INDEX IF NOT EXISTS idx_free_scan_leads_created_at ON free_scan_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_free_scan_leads_source ON free_scan_leads(source);

-- RLS: only service role can insert (API route uses admin client)
ALTER TABLE free_scan_leads ENABLE ROW LEVEL SECURITY;

-- No public policies — only accessible via service role key
