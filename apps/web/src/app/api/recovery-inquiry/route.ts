import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { sendLeadNotification } from '@linkrescue/email';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const item = rateMap.get(ip);
  if (!item || now > item.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  item.count += 1;
  return item.count > 3;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  let body: { email?: unknown; siteUrl?: unknown; interest?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const siteUrl = typeof body.siteUrl === 'string' ? body.siteUrl.trim().slice(0, 500) : '';
  const interest = body.interest === 'monitoring-desk' ? 'monitoring-desk' : 'recovery-sprint';
  if (!emailPattern.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

  try {
    const db = createAdminClient();
    const { error } = await (db.from as Function)('free_scan_leads').insert({
      email,
      site_url: siteUrl || null,
      source: `pricing-${interest}`,
      referrer: req.headers.get('referer') ?? null,
    });
    if (error) throw error;
  } catch (err) {
    console.error('[recovery-inquiry] DB insert failed:', err);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }

  try {
    await sendLeadNotification({
      email,
      siteUrl: siteUrl || null,
      source: `pricing-${interest}`,
      details: interest === 'monitoring-desk' ? 'Requested a managed monitoring readiness review' : 'Requested a Recovery Sprint scope review',
    });
  } catch (err) {
    console.error('[recovery-inquiry] Owner notification failed:', err);
  }

  return NextResponse.json({ ok: true });
}
