-- 006_hardening.sql
-- Stripe webhook idempotency table to prevent duplicate event processing.

CREATE TABLE public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stripe_events_event_id ON public.stripe_events(stripe_event_id);
