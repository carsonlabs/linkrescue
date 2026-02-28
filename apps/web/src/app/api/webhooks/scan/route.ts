import { NextResponse } from 'next/server';
import { authenticateApiRequest, checkRateLimit } from '@/lib/api-auth';
import { hasFeature, type TierName } from '@linkrescue/types';
import { runScan } from '@linkrescue/crawler';
import { createAdminClient, computeHealthScore, upsertHealthScore } from '@linkrescue/database';
import { getPlanLimits } from '@linkrescue/types';

export const maxDuration = 300;

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

  // Check for already-running scan
  const { data: runningScan } = await adminDb
    .from('scans')
    .select('id')
    .eq('site_id', site.id)
    .in('status', ['running', 'pending'])
    .limit(1)
    .maybeSingle() as { data: { id: string } | null };

  if (runningScan) {
    return NextResponse.json(
      { error: 'A scan is already in progress for this site.', scanId: runningScan.id },
      { status: 409 }
    );
  }

  const limits = getPlanLimits(plan as TierName);

  try {
    const scanResult = await runScan({
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages: limits.pagesPerScan,
      supabase: adminDb,
    });

    // Compute health score after scan
    try {
      const healthComponents = await computeHealthScore(adminDb, site.id, limits.pagesPerScan);
      await upsertHealthScore(adminDb, site.id, healthComponents);
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      scanId: scanResult.scanId,
      status: 'completed',
      pagesScanned: scanResult.pagesScanned,
      linksChecked: scanResult.linksChecked,
      remaining: rateLimit.remaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
