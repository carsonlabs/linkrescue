import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@linkrescue/database';
import { createClient } from '@/lib/supabase/server';

const LeadUpdateSchema = z.object({
  leadStatus: z.enum(['new', 'replied', 'qualified', 'scope_sent', 'won', 'not_a_fit']).optional(),
  ownerNotes: z.string().trim().max(4000).nullable().optional(),
});

async function requireOwner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerEmail = process.env.LEAD_NOTIFICATION_EMAIL?.trim().toLowerCase();

  if (!user || !ownerEmail || user.email?.trim().toLowerCase() !== ownerEmail) return null;
  return user;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireOwner())) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = LeadUpdateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Choose a status or enter a note.' }, { status: 400 });
  }

  const update: Record<string, string | null> = {};
  if (parsed.data.leadStatus) update.lead_status = parsed.data.leadStatus;
  if (parsed.data.ownerNotes !== undefined) update.owner_notes = parsed.data.ownerNotes || null;
  if (parsed.data.leadStatus) update.status_updated_at = new Date().toISOString();

  const adminDb = createAdminClient();
  const { data, error } = await (adminDb.from as Function)('free_scan_leads')
    .update(update)
    .eq('id', params.id)
    .select('id, lead_status, owner_notes, status_updated_at')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, lead: data });
}
