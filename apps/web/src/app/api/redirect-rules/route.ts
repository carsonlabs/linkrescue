import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import type { Database } from '@linkrescue/database';
import {
  listRedirectRules,
  createRedirectRule,
  countRedirectRules,
  getDeployedRules,
  createRuleVersion,
  createApprovalLog,
} from '@linkrescue/database';
import { detectChain } from '@linkrescue/governance';
import { z } from 'zod';

const CreateSchema = z.object({
  from_url: z.string().min(1),
  to_url: z.string().url(),
  org_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await listRedirectRules(supabase, user.id);
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

  const count = await countRedirectRules(supabase, user.id);
  if (count >= limits.redirectRules) {
    return NextResponse.json(
      { error: `Plan limit: max ${limits.redirectRules} redirect rules` },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  // Chain detection against deployed rules
  const { data: deployed } = await getDeployedRules(supabase, user.id);
  const existingEdges = (deployed ?? []).map((r: { from_url: string; to_url: string }) => ({ from_url: r.from_url, to_url: r.to_url }));
  const hasCycle = detectChain(existingEdges, { from_url: parsed.data.from_url, to_url: parsed.data.to_url });
  if (hasCycle) {
    return NextResponse.json({ error: 'Would create a redirect cycle' }, { status: 422 });
  }

  const { data: rule, error } = await createRedirectRule(supabase, {
    ...parsed.data,
    user_id: user.id,
    status: 'draft',
    version: 1,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial version record
  await createRuleVersion(supabase, {
    rule_id: rule!.id,
    from_url: rule!.from_url,
    to_url: rule!.to_url,
    status: 'draft',
    version: 1,
    changed_by: user.id,
  });

  return NextResponse.json(rule, { status: 201 });
}
