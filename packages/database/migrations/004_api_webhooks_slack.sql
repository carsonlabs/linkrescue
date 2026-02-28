-- API Keys, Webhook deliveries, and Slack integration tables
-- Run after 003_health_scores_and_trends.sql

-- Add new webhook events to existing enum
ALTER TYPE webhook_event ADD VALUE IF NOT EXISTS 'link.broken';
ALTER TYPE webhook_event ADD VALUE IF NOT EXISTS 'link.fixed';

-- API Keys (hashed, with prefix for lookup)
CREATE TABLE public.api_keys (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          text NOT NULL,
    key_hash      text NOT NULL,
    key_prefix    text NOT NULL,
    last_used_at  timestamp with time zone,
    expires_at    timestamp with time zone,
    revoked_at    timestamp with time zone,
    created_at    timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

-- API Rate Limits (sliding window counters)
CREATE TABLE public.api_rate_limits (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    limit_type    text NOT NULL, -- 'read' or 'scan'
    window_start  timestamp with time zone NOT NULL,
    request_count integer DEFAULT 0 NOT NULL,
    updated_at    timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_api_rate_limits_lookup ON public.api_rate_limits(user_id, limit_type, window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rate limits" ON public.api_rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Webhook Delivery Log (tracks each delivery attempt for existing webhooks table)
CREATE TYPE webhook_delivery_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE public.webhook_deliveries (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id      uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event           webhook_event NOT NULL,
    payload         jsonb NOT NULL,
    status          webhook_delivery_status DEFAULT 'pending' NOT NULL,
    status_code     integer,
    response_body   text,
    attempts        integer DEFAULT 0 NOT NULL,
    next_retry_at   timestamp with time zone,
    delivered_at    timestamp with time zone,
    created_at      timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(status, next_retry_at)
    WHERE status = 'pending' OR status = 'failed';

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own webhook deliveries" ON public.webhook_deliveries
    FOR SELECT USING (
        webhook_id IN (SELECT id FROM public.webhooks WHERE user_id = auth.uid())
    );

-- Slack Integrations
CREATE TABLE public.slack_integrations (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    webhook_url     text NOT NULL,
    channel_name    text, -- display only, from user input
    notify_broken   boolean DEFAULT true NOT NULL,
    notify_scan     boolean DEFAULT true NOT NULL,
    notify_weekly   boolean DEFAULT true NOT NULL,
    is_active       boolean DEFAULT true NOT NULL,
    created_at      timestamp with time zone DEFAULT now() NOT NULL,
    updated_at      timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_slack_per_user UNIQUE (user_id)
);

ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own Slack integration" ON public.slack_integrations
    FOR ALL USING (auth.uid() = user_id);
