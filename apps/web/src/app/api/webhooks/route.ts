import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import type { Database } from '@linkrescue/database';
import { listWebhooks, createWebhook, countWebhooks } from '@linkrescue/database';
import { z } from 'zod';

const WebhookEventValues = ['scan.completed', 'scan.failed', 'guardian.rescued', 'redirect.deployed', 'redirect.rollback'] as const;

const CreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WebhookEventValues)).min(1),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await listWebhooks(supabase, user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Strip secret
  return NextResponse.json((data ?? []).map(({ secret: _, ...rest }: Database['public']['Tables']['webhooks']['Row']) => rest));
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('stripe_price_id').eq('id', user.id).single();
  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  const count = await countWebhooks(supabase, user.id);
  if (count >= limits.webhooks) {
    return NextResponse.json({ error: `Plan limit: max ${limits.webhooks} webhooks` }, { status: 403 });
  }

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const secret = crypto.randomUUID();

  const { data, error } = await createWebhook(supabase, {
    ...parsed.data,
    user_id: user.id,
    secret,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, secret }, { status: 201 });
}
