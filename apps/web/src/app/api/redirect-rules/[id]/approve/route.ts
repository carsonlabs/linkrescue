import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedirectRule, updateRedirectRule, createApprovalLog } from '@linkrescue/database';
import { requireOrgRole } from '@/lib/rbac';
import { RedirectFSM } from '@linkrescue/governance';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Org-scoped rules need admin role
  if (rule.org_id) {
    const allowed = await requireOrgRole(supabase, rule.org_id, user.id, 'admin');
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const fsm = new RedirectFSM(rule.status);
    const newStatus = fsm.transition('approve');
    const { data, error } = await updateRedirectRule(supabase, params.id, { status: newStatus });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createApprovalLog(supabase, { rule_id: params.id, action: 'approved', actor_id: user.id });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
