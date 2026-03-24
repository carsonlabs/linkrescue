import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGuardianLink, updateGuardianLink, deleteGuardianLink } from '@linkrescue/database';
import { z } from 'zod';

const UpdateSchema = z.object({
  original_url: z.string().url().optional(),
  backup_url: z.string().url().optional(),
  status: z.enum(['active', 'paused', 'broken']).optional(),
  value_per_click_cents: z.number().int().min(0).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getGuardianLink(supabase, params.id);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await getGuardianLink(supabase, params.id);
  if (!link || link.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await updateGuardianLink(supabase, params.id, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await getGuardianLink(supabase, params.id);
  if (!link || link.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await deleteGuardianLink(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
