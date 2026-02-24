import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getRedirectRule,
  updateRedirectRule,
  createApprovalLog,
  getDeployedRules,
  createRuleVersion,
} from '@linkrescue/database';
import { RedirectFSM, detectChain } from '@linkrescue/governance';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Re-run chain detection at deploy time (excluding this rule)
  const { data: deployed } = await getDeployedRules(supabase, user.id);
  const existingEdges = (deployed ?? [])
    .filter((r) => r.from_url !== rule.from_url)
    .map((r) => ({ from_url: r.from_url, to_url: r.to_url }));
  const hasCycle = detectChain(existingEdges, { from_url: rule.from_url, to_url: rule.to_url });
  if (hasCycle) {
    return NextResponse.json({ error: 'Would create a redirect cycle' }, { status: 422 });
  }

  try {
    const fsm = new RedirectFSM(rule.status);
    const newStatus = fsm.transition('deploy');
    const newVersion = rule.version + 1;

    const { data, error } = await updateRedirectRule(supabase, params.id, {
      status: newStatus,
      version: newVersion,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createRuleVersion(supabase, {
      rule_id: params.id,
      from_url: rule.from_url,
      to_url: rule.to_url,
      status: newStatus,
      version: newVersion,
      changed_by: user.id,
    });
    await createApprovalLog(supabase, { rule_id: params.id, action: 'deployed', actor_id: user.id });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
