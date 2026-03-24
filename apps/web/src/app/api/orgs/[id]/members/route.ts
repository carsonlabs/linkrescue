import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listOrgMembers, addOrgMember } from '@linkrescue/database';
import { requireOrgRole } from '@/lib/rbac';
import { z } from 'zod';

const InviteSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['viewer', 'member', 'admin']).default('member'),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await requireOrgRole(supabase, params.id, user.id, 'viewer');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await listOrgMembers(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await requireOrgRole(supabase, params.id, user.id, 'admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await addOrgMember(supabase, {
    org_id: params.id,
    user_id: parsed.data.user_id,
    role: parsed.data.role,
    invited_by: user.id,
    accepted_at: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
