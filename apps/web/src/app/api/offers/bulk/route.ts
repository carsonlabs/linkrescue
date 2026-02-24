import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkInsertOffers } from '@linkrescue/database';
import { z } from 'zod';

const RowSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  topic: z.string().max(100).default(''),
  tags: z.union([z.array(z.string()), z.string().transform((s) => s.split(',').map((t) => t.trim()))]).default([]),
  estimated_value_cents: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') ?? '';
  let rows: unknown[] = [];

  if (contentType.includes('application/json')) {
    rows = await request.json();
  } else {
    // CSV parsing
    const text = await request.text();
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0]?.split(',').map((h) => h.trim()) ?? [];
    rows = lines.slice(1).map((line) => {
      const values = line.split(',');
      return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']));
    });
  }

  const valid: z.infer<typeof RowSchema>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = RowSchema.safeParse(rows[i]);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      errors.push(`Row ${i + 1}: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
    }
  }

  const { inserted, errors: insertErrors } = await bulkInsertOffers(
    supabase,
    valid.map((r) => ({ ...r, user_id: user.id })),
  );

  return NextResponse.json({
    inserted,
    skipped: errors.length,
    errors: [...errors, ...insertErrors],
  });
}
