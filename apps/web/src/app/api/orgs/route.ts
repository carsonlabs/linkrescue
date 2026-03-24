import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { countUserOrgs, createOrg } from '@linkrescue/database';
import { z } from 'zod';

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('organizations')
    .select('*, org_members(role, user_id)')
    .or(`owner_id.eq.${user.id},org_members.user_id.eq.${user.id}`);

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

  const currentCount = await countUserOrgs(supabase, user.id);
  if (currentCount >= limits.orgsOwned) {
    return NextResponse.json(
      { error: `Plan limit reached: max ${limits.orgsOwned} organizations` },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data: org, error } = await createOrg(supabase, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    owner_id: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-add creator as owner in org_members
  await supabase.from('org_members').insert({
    org_id: org!.id,
    user_id: user.id,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  });

  return NextResponse.json(org, { status: 201 });
}
