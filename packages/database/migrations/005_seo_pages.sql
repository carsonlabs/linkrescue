-- 005: Programmatic SEO page content schema
-- Supports /check/[network], /vs/[competitor], /guides/[slug]

-- Page type enum
CREATE TYPE seo_page_type AS ENUM ('network_check', 'comparison', 'guide');

-- Status enum
CREATE TYPE seo_page_status AS ENUM ('draft', 'published', 'archived');

-- Main content table
CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  page_type seo_page_type NOT NULL,
  status seo_page_status NOT NULL DEFAULT 'draft',

  -- SEO metadata
  title text NOT NULL,
  meta_description text NOT NULL,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,

  -- Structured content (JSON for flexibility)
  hero_headline text,
  hero_subheadline text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Array of content blocks
  sidebar jsonb,                                -- Optional sidebar content
  faq jsonb,                                    -- Array of {q, a} objects

  -- Network-check specific
  network_name text,           -- e.g. "Amazon Associates"
  network_url text,            -- e.g. "https://affiliate-program.amazon.com"
  network_commission text,     -- e.g. "1-10%"
  network_cookie_days integer, -- e.g. 24

  -- Comparison specific
  competitor_name text,
  competitor_url text,
  comparison_features jsonb,   -- Array of {feature, linkrescue, competitor} objects

  -- Timestamps
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique slug per page type
CREATE UNIQUE INDEX idx_seo_pages_type_slug ON seo_pages (page_type, slug);

-- Index for lookups
CREATE INDEX idx_seo_pages_status ON seo_pages (status) WHERE status = 'published';

-- Updated-at trigger
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

-- RLS: public read for published pages, no write from client
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published SEO pages"
  ON seo_pages FOR SELECT
  USING (status = 'published');
