import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { z } from 'zod';

const Schema = z.object({
  leadId: z.string().uuid(),
  step: z.number().int().min(0).max(3),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const adminDb = createAdminClient();
  await adminDb
    .from('email_leads')
    .update({ wizard_progress: parsed.data.step })
    .eq('id', parsed.data.leadId);

  return NextResponse.json({ ok: true });
}
