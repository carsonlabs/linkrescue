import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, hasFeature, getTierLimits, type TierName } from '@linkrescue/types';
import crypto from 'crypto';

// GET /api/v1/webhooks — list user's webhook endpoints
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('id, url, events, last_triggered_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }

  return NextResponse.json({ webhooks: webhooks ?? [] });
}

// POST /api/v1/webhooks — create a new webhook endpoint
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
  if (!hasFeature(plan, 'webhooks')) {
    return NextResponse.json(
      { error: 'Webhooks require an Agency plan.' },
      { status: 403 }
    );
  }

  // Check limit
  const limits = getTierLimits(plan);
  const { count } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count ?? 0) >= limits.webhooks) {
    return NextResponse.json(
      { error: `Maximum ${limits.webhooks} webhooks. Remove one first.` },
      { status: 400 }
    );
  }

  // Parse body
  let body: { url?: string; events?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const validEvents = ['scan.completed', 'scan.failed', 'link.broken', 'link.fixed'];
  const events = (body.events ?? ['scan.completed']).filter((e) => validEvents.includes(e));
  if (events.length === 0) {
    return NextResponse.json({ error: 'At least one valid event is required' }, { status: 400 });
  }

  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .insert({
      user_id: user.id,
      url: body.url.trim(),
      events: events as any,
      secret,
    })
    .select('id, url, events, secret, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }

  return NextResponse.json({ webhook });
}
