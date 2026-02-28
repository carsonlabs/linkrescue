import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, hasFeature, type TierName } from '@linkrescue/types';
import { testSlackWebhook } from '@/lib/slack';

// GET /api/v1/slack — get user's Slack integration
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('id, webhook_url, channel_name, notify_broken, notify_scan, notify_weekly, is_active, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ integration });
}

// POST /api/v1/slack — create or update Slack integration
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check plan
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null) as TierName;
  if (!hasFeature(plan, 'slack_integration')) {
    return NextResponse.json(
      { error: 'Slack integration requires an Agency plan.' },
      { status: 403 }
    );
  }

  let body: {
    webhook_url?: string;
    channel_name?: string;
    notify_broken?: boolean;
    notify_scan?: boolean;
    notify_weekly?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.webhook_url?.trim()) {
    return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
  }

  // Validate it looks like a Slack webhook
  if (!body.webhook_url.startsWith('https://hooks.slack.com/')) {
    return NextResponse.json(
      { error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/' },
      { status: 400 }
    );
  }

  // Check if integration already exists
  const { data: existing } = await supabase
    .from('slack_integrations')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const integrationData = {
    user_id: user.id,
    webhook_url: body.webhook_url.trim(),
    channel_name: body.channel_name?.trim() || null,
    notify_broken: body.notify_broken ?? true,
    notify_scan: body.notify_scan ?? true,
    notify_weekly: body.notify_weekly ?? true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    result = await supabase
      .from('slack_integrations')
      .update(integrationData)
      .eq('id', (existing as any).id)
      .select('id, webhook_url, channel_name, notify_broken, notify_scan, notify_weekly, is_active')
      .single();
  } else {
    result = await supabase
      .from('slack_integrations')
      .insert(integrationData)
      .select('id, webhook_url, channel_name, notify_broken, notify_scan, notify_weekly, is_active')
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: 'Failed to save Slack integration' }, { status: 500 });
  }

  return NextResponse.json({ integration: result.data });
}

// DELETE /api/v1/slack — remove Slack integration
export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await supabase
    .from('slack_integrations')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
