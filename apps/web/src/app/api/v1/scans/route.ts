import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, checkRateLimit } from '@/lib/api-auth';
import { createAdminClient } from '@linkrescue/database';
import { getTierLimits } from '@linkrescue/types';
import { randomUUID } from 'crypto';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/v1/scans
 *
 * Submit a site scan job. Returns immediately with a scan_id.
 * Poll GET /api/v1/scans/:scanId for status, or provide a webhook_url
 * to be notified on completion.
 *
 * Body: { "url": "https://example.com", "webhook_url"?: "https://..." }
 * Response: 202 { scan_id, status: "pending", poll_url, estimated_seconds }
 */
export async function POST(req: NextRequest) {
  // Auth
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: CORS_HEADERS },
    );
  }

  // Rate limit (scan type — per day)
  const rateLimit = await checkRateLimit(auth.context.userId, auth.context.plan, 'scan');
  const rateLimitHeaders = {
    ...CORS_HEADERS,
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Daily scan limit reached', reset_at: rateLimit.resetAt.toISOString() },
      { status: 429, headers: rateLimitHeaders },
    );
  }

  // Parse body
  let body: { url?: string; webhook_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const rawUrl = (body.url ?? '').trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: '"url" is required — provide the domain to scan (e.g. https://example.com)' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Normalize URL to domain
  let domain: string;
  try {
    const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    domain = parsed.hostname;
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const adminDb = createAdminClient();
  const tierLimits = getTierLimits(auth.context.plan);

  // Check if user has this site registered
  const { data: site } = await adminDb
    .from('sites')
    .select('id, domain, sitemap_url, crawl_exclusions')
    .eq('user_id', auth.context.userId)
    .eq('domain', domain)
    .maybeSingle();

  if (!site) {
    return NextResponse.json(
      { error: `Site "${domain}" not found in your account. Add it to your dashboard first.` },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Check for in-progress scan
  const { data: activeScan } = await adminDb
    .from('scans')
    .select('id, status')
    .eq('site_id', site.id)
    .in('status', ['pending', 'running'])
    .maybeSingle();

  if (activeScan) {
    return NextResponse.json(
      {
        error: 'Scan already in progress for this site',
        scan_id: activeScan.id,
        status: activeScan.status,
      },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  // Create pending scan row
  const scanId = randomUUID();
  const maxPages = tierLimits.pagesPerScan === Infinity ? 50000 : tierLimits.pagesPerScan;

  const { error: insertError } = await adminDb
    .from('scans')
    .insert({
      id: scanId,
      site_id: site.id,
      status: 'pending',
      triggered_by: 'api',
    });

  if (insertError) {
    console.error('[v1/scans] Insert error:', insertError.message);
    return NextResponse.json(
      { error: 'Failed to create scan job' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  // If webhook_url provided, store it for post-scan delivery
  if (body.webhook_url) {
    await adminDb
      .from('scan_events')
      .insert({
        scan_id: scanId,
        level: 'info',
        message: `API webhook callback: ${body.webhook_url}`,
      })
      .then(() => {}, () => {});
  }

  // Dispatch to scan worker (fire-and-forget)
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.linkrescue.io'}/api/internal/scan-worker`;

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({
      scanId,
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages,
      crawlExclusions: site.crawl_exclusions,
      userId: auth.context.userId,
    }),
  }).catch((err) => {
    console.error('[v1/scans] Worker dispatch failed:', err);
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.linkrescue.io';

  return NextResponse.json(
    {
      scan_id: scanId,
      status: 'pending',
      domain,
      poll_url: `${baseUrl}/api/v1/scans/${scanId}`,
      estimated_seconds: Math.min(maxPages * 2, 300),
    },
    { status: 202, headers: rateLimitHeaders },
  );
}
