import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedirectRule, updateRedirectRule, createApprovalLog } from '@linkrescue/database';
import { RedirectFSM } from '@linkrescue/governance';
import { z } from 'zod';

const Schema = z.object({ note: z.string().optional() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { note } = Schema.parse(body);

  try {
    const fsm = new RedirectFSM(rule.status);
    const newStatus = fsm.transition('reject');
    const { data, error } = await updateRedirectRule(supabase, params.id, { status: newStatus });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createApprovalLog(supabase, {
      rule_id: params.id,
      action: 'rejected',
      actor_id: user.id,
      note: note ?? null,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
