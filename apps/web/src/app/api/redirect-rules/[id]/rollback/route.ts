import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getRedirectRule,
  updateRedirectRule,
  createApprovalLog,
  listRuleVersions,
} from '@linkrescue/database';
import { RedirectFSM } from '@linkrescue/governance';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Load previous version (version - 1)
  const { data: versions } = await listRuleVersions(supabase, params.id);
  const previousVersion = (versions ?? []).find((v) => v.version === rule.version - 1);

  try {
    const fsm = new RedirectFSM(rule.status);
    const newStatus = fsm.transition('rollback');

    const updateData: Record<string, unknown> = { status: newStatus };
    if (previousVersion) {
      updateData.from_url = previousVersion.from_url;
      updateData.to_url = previousVersion.to_url;
    }

    const { data, error } = await updateRedirectRule(supabase, params.id, updateData);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createApprovalLog(supabase, { rule_id: params.id, action: 'rolled_back', actor_id: user.id });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
