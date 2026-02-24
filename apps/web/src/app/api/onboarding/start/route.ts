import { NextResponse } from 'next/server';
import { createAdminClient, type Database } from '@linkrescue/database';
import { runScan } from '@linkrescue/crawler';
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email(),
  url: z.string().url(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { email, url } = parsed.data;
  const adminDb = createAdminClient();

  // Upsert email lead
  const { data: leadData, error: leadError } = await adminDb
    .from('email_leads')
    .upsert({ email, wizard_progress: 0 }, { onConflict: 'email' })
    .select()
    .single();

  const lead = leadData as Database['public']['Tables']['email_leads']['Row'] | null;

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }

  // Extract domain from URL
  const domain = new URL(url).hostname;

  // Create a temporary site record (no user, admin-owned)
  const { data: siteData, error: siteError } = await adminDb
    .from('sites')
    .insert({
      user_id: lead.id,
      domain,
      sitemap_url: null,
      verify_token: crypto.randomUUID(),
      verified_at: new Date().toISOString(),
    })
    .select()
    .single();

  const site = siteData as Database['public']['Tables']['sites']['Row'] | null;

  if (siteError || !site) {
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }

  // Start scan (limited to 10 pages)
  let scanId: string | null = null;
  try {
    const result = await runScan({
      siteId: site.id,
      domain,
      sitemapUrl: null,
      maxPages: 10,
      supabase: adminDb,
    });
    scanId = result.scanId;
  } catch {
    return NextResponse.json({ error: 'Scan failed to start' }, { status: 500 });
  }

  // Link scan to lead
  await adminDb.from('email_leads').update({ scan_id: scanId }).eq('id', lead.id);

  return NextResponse.json({ scanId, leadId: lead.id }, { status: 201 });
}
