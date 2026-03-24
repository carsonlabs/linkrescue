import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateOrgMember, removeOrgMember } from '@linkrescue/database';
import { requireOrgRole } from '@/lib/rbac';
import { z } from 'zod';

const UpdateSchema = z.object({
  role: z.enum(['viewer', 'member', 'admin']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await requireOrgRole(supabase, params.id, user.id, 'admin');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await updateOrgMember(supabase, params.id, params.userId, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; userId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Allow self-removal or admin
  const isSelf = user.id === params.userId;
  if (!isSelf) {
    const allowed = await requireOrgRole(supabase, params.id, user.id, 'admin');
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await removeOrgMember(supabase, params.id, params.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
