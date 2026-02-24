import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { z } from 'zod';

const VerifySchema = z.object({ url: z.string().url() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ rescueUrl: null });

  const adminDb = createAdminClient();
  const { data: link } = await adminDb
    .from('guardian_links')
    .select('slug')
    .eq('original_url', parsed.data.url)
    .eq('status', 'active')
    .single();

  if (!link) return NextResponse.json({ rescueUrl: null });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.json({ rescueUrl: `${appUrl}/api/rescue/${link.slug}` });
}
