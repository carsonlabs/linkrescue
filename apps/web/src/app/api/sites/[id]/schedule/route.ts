import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScheduleBySite, upsertSchedule, deleteSchedule, computeNextRunAt } from '@linkrescue/database';
import { z } from 'zod';

const UpsertSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: site } = await supabase
    .from('sites').select('user_id').eq('id', params.id).single();
  if (!site || site.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data } = await getScheduleBySite(supabase, params.id);
  return NextResponse.json(data ?? null);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: site } = await supabase
    .from('sites').select('user_id').eq('id', params.id).single();
  if (!site || site.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const nextRunAt = computeNextRunAt(parsed.data.frequency);
  const { data, error } = await upsertSchedule(supabase, params.id, parsed.data.frequency, nextRunAt);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export const PATCH = POST; // Same upsert logic

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: site } = await supabase
    .from('sites').select('user_id').eq('id', params.id).single();
  if (!site || site.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await deleteSchedule(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
