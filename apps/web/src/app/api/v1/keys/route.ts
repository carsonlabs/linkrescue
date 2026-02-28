import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, hasFeature, type TierName } from '@linkrescue/types';
import { generateApiKey, hashApiKey } from '@/lib/api-auth';

// GET /api/v1/keys — list user's API keys
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }

  return NextResponse.json({ keys: keys ?? [] });
}

// POST /api/v1/keys — create a new API key
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
  if (!hasFeature(plan, 'api_access')) {
    return NextResponse.json(
      { error: 'API access requires a paid plan. Upgrade to Pro or Agency.' },
      { status: 403 }
    );
  }

  // Parse body
  let body: { name?: string; expires_in_days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
  }

  // Limit number of active keys per user (max 10)
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'Maximum 10 active API keys. Revoke an existing key first.' },
      { status: 400 }
    );
  }

  const { fullKey, prefix } = generateApiKey();
  const keyHash = await hashApiKey(fullKey);

  const expiresAt = body.expires_in_days
    ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: newKey, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      key_hash: keyHash,
      key_prefix: prefix,
      expires_at: expiresAt,
    })
    .select('id, name, key_prefix, expires_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }

  return NextResponse.json({
    key: {
      ...newKey,
      full_key: fullKey, // Only returned once at creation
    },
  });
}
