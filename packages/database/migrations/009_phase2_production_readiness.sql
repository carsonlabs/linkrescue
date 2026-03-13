-- Phase 2: Production-readiness improvements
-- Adds scan summary counters, crawl exclusions, and retention support.

-- 1. Structured operational counters on scans (JSONB for flexibility)
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS scan_summary jsonb;

-- 2. Customer crawl exclusions on sites (array of glob patterns)
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS crawl_exclusions text[] DEFAULT '{}' NOT NULL;

-- 3. Index for retention cleanup (find old scans efficiently)
CREATE INDEX IF NOT EXISTS idx_scans_finished_at ON public.scans(finished_at)
  WHERE finished_at IS NOT NULL;

-- 4. Index for stuck-scan recovery (find scans stuck in running)
CREATE INDEX IF NOT EXISTS idx_scans_status_started ON public.scans(status, started_at)
  WHERE status = 'running';
