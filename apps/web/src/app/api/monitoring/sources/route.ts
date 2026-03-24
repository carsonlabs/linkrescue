import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@linkrescue/database';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { listLogSources, createLogSource, countLogSources } from '@linkrescue/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  format: z.enum(['nginx', 'apache', 'cloudflare', 'custom_json']),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await listLogSources(supabase, user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Strip api_key_hash from response
  return NextResponse.json((data ?? []).map(({ api_key_hash: _, ...rest }: Database['public']['Tables']['log_sources']['Row']) => rest));
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('stripe_price_id').eq('id', user.id).single();
  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  const count = await countLogSources(supabase, user.id);
  if (count >= limits.logSources) {
    return NextResponse.json(
      { error: `Plan limit: max ${limits.logSources} log sources` },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  // Generate API key
  const plainKey = crypto.randomUUID();
  const hashedKey = await bcrypt.hash(plainKey, 10);

  const { data, error } = await createLogSource(supabase, {
    ...parsed.data,
    user_id: user.id,
    api_key_hash: hashedKey,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { api_key_hash: _, ...rest } = data!;
  return NextResponse.json({ ...rest, api_key: plainKey }, { status: 201 });
}
