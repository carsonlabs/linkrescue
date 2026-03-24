import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLogSource, updateLogSource, deleteLogSource } from '@linkrescue/database';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  format: z.enum(['nginx', 'apache', 'cloudflare', 'custom_json']).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getLogSource(supabase, params.id);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { api_key_hash: _, ...rest } = data;
  return NextResponse.json(rest);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: source } = await getLogSource(supabase, params.id);
  if (!source || source.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await updateLogSource(supabase, params.id, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { api_key_hash: _, ...rest } = data!;
  return NextResponse.json(rest);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: source } = await getLogSource(supabase, params.id);
  if (!source || source.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await deleteLogSource(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
