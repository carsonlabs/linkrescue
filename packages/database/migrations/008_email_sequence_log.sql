-- Track which onboarding/marketing emails have been sent to each user
-- to prevent duplicate sends when the cron runs daily.
CREATE TABLE public.email_sequence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_key text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_key)
);

CREATE INDEX idx_email_sequence_user ON public.email_sequence_log(user_id);

-- RLS: only accessible via service role (cron endpoint uses admin client)
ALTER TABLE public.email_sequence_log ENABLE ROW LEVEL SECURITY;
