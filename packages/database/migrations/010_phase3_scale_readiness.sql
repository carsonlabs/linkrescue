-- Phase 3: Scale-readiness improvements
-- Adds idempotency key, trigger source tracking, and domain-level stats.

-- 1. Dispatch key for idempotent scan creation
-- Callers set this before dispatching; the worker uses it to claim the scan.
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS dispatch_key text UNIQUE;

-- 2. Track where a scan was triggered from
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS trigger_source text;

-- 3. Index for fast dispatch_key lookup (used by worker to claim scans)
CREATE INDEX IF NOT EXISTS idx_scans_dispatch_key ON public.scans(dispatch_key)
  WHERE dispatch_key IS NOT NULL;

-- 4. Partial index for finding active scans per site (pending or running)
CREATE INDEX IF NOT EXISTS idx_scans_site_active ON public.scans(site_id, status)
  WHERE status IN ('pending', 'running');
