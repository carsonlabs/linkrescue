import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/v1/webhooks/[id] — delete a webhook endpoint
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/v1/webhooks/[id] — update a webhook endpoint
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { url?: string; events?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.url) {
    try {
      new URL(body.url);
      update.url = body.url.trim();
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }

  if (body.events) {
    const validEvents = ['scan.completed', 'scan.failed', 'link.broken', 'link.fixed'];
    const events = body.events.filter((e) => validEvents.includes(e));
    if (events.length === 0) {
      return NextResponse.json({ error: 'At least one valid event is required' }, { status: 400 });
    }
    update.events = events;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .update(update as any)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, url, events, last_triggered_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }

  return NextResponse.json({ webhook });
}
