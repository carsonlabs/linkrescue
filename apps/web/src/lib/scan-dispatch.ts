import { createAdminClient } from '@linkrescue/database';
import { waitUntil } from '@vercel/functions';

export type TriggerSource = 'cron' | 'manual' | 'webhook' | 'onboarding' | 'schedule';

export interface DispatchParams {
  siteId: string;
  domain: string;
  sitemapUrl: string | null;
  maxPages: number;
  crawlExclusions?: string[];
  userId?: string;
  triggerSource: TriggerSource;
}

async function invokeScanWorker(scanId: string, params: DispatchParams): Promise<void> {
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/scan-worker`;
  const secret = process.env.CRON_SECRET;

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        scanId,
        siteId: params.siteId,
        domain: params.domain,
        sitemapUrl: params.sitemapUrl,
        maxPages: params.maxPages,
        crawlExclusions: params.crawlExclusions,
        userId: params.userId,
      }),
    });

    if (!response.ok) {
      console.error(
        `[scan-dispatch] Worker rejected scan ${scanId}: ${response.status} ${response.statusText}`,
      );
    }
  } catch (err) {
    console.error(`[scan-dispatch] Failed to dispatch scan ${scanId} to worker:`, err);
  }
}

/**
 * Create a pending scan record and dispatch it to the internal worker.
 *
 * Idempotency model:
 * 1. Generate a dispatch_key = `${siteId}:${timestamp}` — unique per dispatch.
 * 2. Insert a 'pending' scan row with the dispatch_key.
 * 3. Fire-and-forget POST to the worker with the scanId.
 * 4. The worker atomically claims the scan (pending -> running) before executing.
 *    If the claim fails (already running or already claimed), the worker no-ops.
 *
 * Returns the scanId so callers can reference it immediately.
 */
export async function dispatchScanWorker(params: DispatchParams): Promise<string | null> {
  const { siteId, domain, sitemapUrl, maxPages, crawlExclusions, userId, triggerSource } = params;
  const adminDb = createAdminClient();

  // Check for already-active scan to avoid creating pointless pending rows
  const { data: activeScan } = await adminDb
    .from('scans')
    .select('id, status')
    .eq('site_id', siteId)
    .in('status', ['pending', 'running'])
    .limit(1)
    .maybeSingle();

  if (activeScan) {
    if (activeScan.status === 'pending') {
      // Safe retry: the worker atomically claims pending scans, so re-dispatching
      // an interrupted request cannot create a duplicate scan.
      waitUntil(invokeScanWorker(activeScan.id, params));
      return activeScan.id;
    }

    console.log(`[scan-dispatch] Skipping dispatch for site ${siteId}: scan ${activeScan.id} already active`);
    return null;
  }

  // Create pending scan with dispatch_key
  const dispatchKey = `${siteId}:${Date.now()}`;
  const { data: scan, error } = await adminDb
    .from('scans')
    .insert({
      site_id: siteId,
      status: 'pending',
      dispatch_key: dispatchKey,
      trigger_source: triggerSource,
    })
    .select('id')
    .single();

  if (error || !scan) {
    console.error('[scan-dispatch] Failed to create pending scan:', error?.message);
    return null;
  }

  const scanId = scan.id;

  // Keep the request alive after the API response is returned. A plain unawaited
  // fetch can be discarded when a Vercel function finishes its invocation.
  waitUntil(invokeScanWorker(scanId, params));

  return scanId;
}
