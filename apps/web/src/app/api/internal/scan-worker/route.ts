import { NextResponse } from 'next/server';
import { runScan } from '@linkrescue/crawler';
import { createAdminClient, computeHealthScore, upsertHealthScore } from '@linkrescue/database';
import { dispatchWebhook } from '@/lib/webhooks';
import { notifySlack, formatScanComplete } from '@/lib/slack';

export const maxDuration = 300; // 5 minutes for Vercel Pro

/**
 * Internal scan worker endpoint.
 *
 * Idempotency: The caller creates a 'pending' scan row and passes its scanId.
 * This worker atomically claims the scan by transitioning pending -> running.
 * If the claim fails (scan already running/completed/failed), the worker no-ops.
 * This prevents duplicate execution from retries or multiple dispatches.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { scanId, siteId, domain, sitemapUrl, maxPages, crawlExclusions, userId } = body as {
    scanId: string;
    siteId: string;
    domain: string;
    sitemapUrl: string | null;
    maxPages: number;
    crawlExclusions?: string[];
    userId?: string;
  };

  if (!scanId || !siteId || !domain || !maxPages) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Atomic claim: only transition pending -> running
  // If the scan is not in 'pending' status, another worker already claimed it.
  const { data: claimed, error: claimError } = await adminDb
    .from('scans')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', scanId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (claimError) {
    console.error(`[scan-worker] Claim error for scan ${scanId}:`, claimError.message);
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 });
  }

  if (!claimed) {
    // Another worker already claimed this scan, or it was recovered/cancelled
    return NextResponse.json({ status: 'skipped', reason: 'scan not in pending state' });
  }

  try {
    const scanResult = await runScan({
      scanId,
      siteId,
      domain,
      sitemapUrl: sitemapUrl ?? null,
      maxPages,
      crawlExclusions,
      supabase: adminDb,
    });

    // Post-scan: compute health score
    try {
      const healthComponents = await computeHealthScore(adminDb, siteId, maxPages);
      await upsertHealthScore(adminDb, siteId, healthComponents);
    } catch (err) {
      console.error(`[scan-worker] Health score computation failed for site ${siteId}:`, err instanceof Error ? err.message : err);
    }

    // Post-scan: webhooks and Slack (only if we have a userId)
    if (userId) {
      dispatchWebhook(userId, 'scan.completed', {
        siteId,
        domain,
        scanId: scanResult.scanId,
        pagesScanned: scanResult.pagesScanned,
        linksChecked: scanResult.linksChecked,
      }).catch(() => {});

      notifySlack(
        userId,
        'scan',
        formatScanComplete(domain, scanResult.pagesScanned, scanResult.linksChecked, 0),
      ).catch(() => {});
    }

    return NextResponse.json({
      scanId: scanResult.scanId,
      pagesScanned: scanResult.pagesScanned,
      linksChecked: scanResult.linksChecked,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    // runScan already marks the scan as 'failed' in the DB
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
