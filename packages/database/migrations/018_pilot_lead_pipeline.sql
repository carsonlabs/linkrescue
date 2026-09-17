-- Owner-only operating fields for the service-led LinkRescue pilot.
-- This extends the existing RLS-locked free_scan_leads table. Public forms
-- continue inserting through server-side routes; only the owner dashboard API
-- can update the fields below through the service role after owner auth.

ALTER TABLE public.free_scan_leads
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS owner_notes text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.free_scan_leads
  DROP CONSTRAINT IF EXISTS free_scan_leads_lead_status_check;

ALTER TABLE public.free_scan_leads
  ADD CONSTRAINT free_scan_leads_lead_status_check
  CHECK (lead_status IN ('new', 'replied', 'qualified', 'scope_sent', 'won', 'not_a_fit'));

CREATE INDEX IF NOT EXISTS idx_free_scan_leads_status_updated_at
  ON public.free_scan_leads (lead_status, status_updated_at DESC);
