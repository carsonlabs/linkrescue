import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { listOffers, createOffer, countOffers } from '@linkrescue/database';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  topic: z.string().max(100).default(''),
  tags: z.array(z.string()).default([]),
  estimated_value_cents: z.number().int().min(0).default(0),
  org_id: z.string().uuid().optional().nullable(),
});

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') ?? undefined;

  const { data, error } = await listOffers(supabase, user.id, topic);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('stripe_price_id').eq('id', user.id).single();
  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  const count = await countOffers(supabase, user.id);
  if (count >= limits.offers) {
    return NextResponse.json({ error: `Plan limit: max ${limits.offers} offers` }, { status: 403 });
  }

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await createOffer(supabase, { ...parsed.data, user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
