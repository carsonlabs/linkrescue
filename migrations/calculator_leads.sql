-- Calculator lead capture table
-- Stores leads from the revenue calculator for follow-up

CREATE TABLE IF NOT EXISTS calculator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  monthly_revenue NUMERIC,
  broken_link_percentage NUMERIC,
  estimated_loss NUMERIC,
  site_url TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for dedup and lookups
CREATE INDEX IF NOT EXISTS idx_calculator_leads_email ON calculator_leads(email);
CREATE INDEX IF NOT EXISTS idx_calculator_leads_created_at ON calculator_leads(created_at DESC);

-- RLS: only service role can insert (API route uses admin client)
ALTER TABLE calculator_leads ENABLE ROW LEVEL SECURITY;

-- No public policies — only accessible via service role key
