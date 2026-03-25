-- Phase 3: Detection Intelligence
-- Adds columns for soft-404 detection, content change tracking, and Wayback Machine integration.

-- ── Links table: content tracking columns ──
-- content_hash: FNV-1a hash of extracted text content, for quick change detection
-- content_text: truncated text content (max 10KB), for detailed Jaccard similarity comparison
ALTER TABLE links ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE links ADD COLUMN IF NOT EXISTS content_text text;

-- ── Scan results: wayback archive URL ──
-- When a link is broken, we check if an archived version exists on the Wayback Machine.
ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS wayback_url text;

-- ── Update issue_type CHECK constraint to include new types ──
-- Note: If the column uses a CHECK constraint, update it. If it's just a text column,
-- the new values ('SOFT_404', 'CONTENT_CHANGED') are handled at the application level.
-- Supabase typically uses text columns without CHECK constraints, so this is informational.

-- ── Index for content change detection queries ──
CREATE INDEX IF NOT EXISTS idx_links_content_hash ON links (content_hash) WHERE content_hash IS NOT NULL;

COMMENT ON COLUMN links.content_hash IS 'FNV-1a hash of extracted text content for quick change detection';
COMMENT ON COLUMN links.content_text IS 'Truncated text content (max 10KB) for Jaccard similarity comparison';
COMMENT ON COLUMN scan_results.wayback_url IS 'Wayback Machine archived URL for broken links';
