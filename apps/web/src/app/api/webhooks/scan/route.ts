import { NextResponse } from 'next/server';
import { authenticateApiRequest, checkRateLimit } from '@/lib/api-auth';
import { hasFeature, type TierName } from '@linkrescue/types';
import { createAdminClient } from '@linkrescue/database';
import { getPlanLimits } from '@linkrescue/types';
import { dispatchScanWorker } from '@/lib/scan-dispatch';

export async function POST(request: Request) {
  // Authenticate via API key
  const auth = await authenticateApiRequest(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, plan, apiKeyId } = auth.context;

  // Agency-only feature
  if (!hasFeature(plan as TierName, 'webhooks')) {
    return NextResponse.json(
      { error: 'Webhook-triggered scans require an Agency plan.' },
      { status: 403 }
    );
  }

  // Check rate limit (scan type = per day)
  const rateLimit = await checkRateLimit(userId, plan, 'scan');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Daily scan limit reached.',
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  // Parse request body
  let body: { siteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.siteId) {
    return NextResponse.json({ error: 'Missing required field: siteId' }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Verify site ownership
  type SiteRow = {
    id: string;
    domain: string;
    sitemap_url: string | null;
    verified_at: string | null;
    user_id: string;
    crawl_exclusions: string[];
  };
  const { data: site } = await adminDb
    .from('sites')
    .select('*')
    .eq('id', body.siteId)
    .eq('user_id', userId)
    .single() as { data: SiteRow | null };

  if (!site) {
    return NextResponse.json({ error: 'Site not found or not owned by you' }, { status: 404 });
  }

  if (!site.verified_at) {
    return NextResponse.json({ error: 'Site must be verified before scanning' }, { status: 403 });
  }

  const limits = getPlanLimits(plan as TierName);

  // Dispatch scan to background worker (checks for active scans internally)
  const scanId = await dispatchScanWorker({
    siteId: site.id,
    domain: site.domain,
    sitemapUrl: site.sitemap_url,
    maxPages: limits.pagesPerScan,
    crawlExclusions: site.crawl_exclusions ?? [],
    userId,
    triggerSource: 'webhook',
  });

  if (!scanId) {
    return NextResponse.json(
      { error: 'A scan is already in progress for this site.' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    status: 'dispatched',
    scanId,
    remaining: rateLimit.remaining,
  });
}
