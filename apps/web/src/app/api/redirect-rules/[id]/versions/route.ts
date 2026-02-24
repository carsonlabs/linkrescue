import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedirectRule, listRuleVersions, listApprovalLog } from '@linkrescue/database';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: versions }, { data: approvalLog }] = await Promise.all([
    listRuleVersions(supabase, params.id),
    listApprovalLog(supabase, params.id),
  ]);

  return NextResponse.json({ versions: versions ?? [], approvalLog: approvalLog ?? [] });
}
