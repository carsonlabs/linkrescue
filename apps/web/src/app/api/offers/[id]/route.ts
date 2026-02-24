import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOffer, updateOffer, deleteOffer } from '@linkrescue/database';
import { z } from 'zod';

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  topic: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  estimated_value_cents: z.number().int().min(0).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getOffer(supabase, params.id);
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: offer } = await getOffer(supabase, params.id);
  if (!offer || offer.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await updateOffer(supabase, params.id, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: offer } = await getOffer(supabase, params.id);
  if (!offer || offer.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await deleteOffer(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
