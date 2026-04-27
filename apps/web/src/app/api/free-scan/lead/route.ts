import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';

export const maxDuration = 30;

interface LeadPayload {
  scanId: string;
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { scanId, email } = body;

  if (!scanId || typeof scanId !== 'string') {
    return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: scan, error: scanErr } = await (db.from as Function)('free_scan_results')
    .select('domain, broken_links_count, broken_affiliate_count, estimated_monthly_loss')
    .eq('id', scanId)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  try {
    await (db.from as Function)('free_scan_leads').insert({
      email: email.toLowerCase().trim(),
      site_url: scan.domain,
      source: 'free-scan-postgate',
      broken_links_count: scan.broken_links_count,
      affiliate_issues_count: scan.broken_affiliate_count,
      estimated_loss: scan.estimated_monthly_loss,
      scanned_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[free-scan-lead] DB insert failed:', err);
    return NextResponse.json({ error: 'Could not save email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
