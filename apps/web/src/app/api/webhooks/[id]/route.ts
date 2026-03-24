import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebhook, updateWebhook, deleteWebhook } from '@linkrescue/database';
import { z } from 'zod';

const WebhookEventValues = ['scan.completed', 'scan.failed', 'guardian.rescued', 'redirect.deployed', 'redirect.rollback'] as const;

const UpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WebhookEventValues)).min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: hook } = await getWebhook(supabase, params.id);
  if (!hook || hook.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid request data" } }, { status: 400 });

  const { data, error } = await updateWebhook(supabase, params.id, parsed.data);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { secret: _, ...rest } = data!;
  return NextResponse.json(rest);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: hook } = await getWebhook(supabase, params.id);
  if (!hook || hook.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await deleteWebhook(supabase, params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
