import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { listGuardianLinks, createGuardianLink, countGuardianLinks } from '@linkrescue/database';
import { z } from 'zod';

const CreateSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  original_url: z.string().url(),
  backup_url: z.string().url(),
  value_per_click_cents: z.number().int().min(0).default(0),
  org_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await listGuardianLinks(supabase, user.id);
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

  const count = await countGuardianLinks(supabase, user.id);
  if (count >= limits.guardianLinks) {
    return NextResponse.json(
      { error: `Plan limit: max ${limits.guardianLinks} guardian links` },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await createGuardianLink(supabase, {
    ...parsed.data,
    user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
