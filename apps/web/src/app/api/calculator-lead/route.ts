import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';

interface LeadPayload {
  email: string;
  monthlyLoss: number;
  annualLoss: number;
  siteUrl?: string;
}

/* Rate limiter: 5 submissions per hour per IP */
const rateMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, monthlyLoss, annualLoss, siteUrl } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Persist lead to database (table created via calculator_leads.sql migration)
  // Uses type cast because calculator_leads isn't in generated types yet
  try {
    const db = createAdminClient();
    const { error: dbErr } = await (db.from as Function)('calculator_leads').insert({
      email: email.toLowerCase().trim(),
      monthly_revenue: monthlyLoss,
      estimated_loss: annualLoss,
      site_url: siteUrl ?? null,
      referrer: req.headers.get('referer') ?? null,
    });
    if (dbErr) throw dbErr;
  } catch (err) {
    console.error('[calculator-lead] DB insert failed:', err);
    // Don't fail the request — still log and return ok
  }

  // TODO: Send transactional email via Resend (post-launch)
  // TODO: Tag subscriber in email marketing list (post-launch)

  console.log('[calculator-lead]', { email, monthlyLoss, annualLoss });

  return NextResponse.json({ ok: true });
}
