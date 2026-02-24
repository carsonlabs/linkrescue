import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedirectRule, updateRedirectRule } from '@linkrescue/database';
import { z } from 'zod';

const UpdateSchema = z.object({
  from_url: z.string().min(1).optional(),
  to_url: z.string().url().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getRedirectRule(supabase, params.id);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rule } = await getRedirectRule(supabase, params.id);
  if (!rule || rule.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (rule.status !== 'draft')
    return NextResponse.json({ error: 'Only draft rules can be edited' }, { status: 422 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await updateRedirectRule(supabase, params.id, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
