import { createAdminClient } from '@linkrescue/database';

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
    .select('id')
    .eq('site_id', siteId)
    .in('status', ['pending', 'running'])
    .limit(1)
    .maybeSingle();

  if (activeScan) {
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

  // Fire-and-forget to worker
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/scan-worker`;
  const secret = process.env.CRON_SECRET;

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      scanId,
      siteId,
      domain,
      sitemapUrl,
      maxPages,
      crawlExclusions,
      userId,
    }),
  }).catch((err) => {
    console.error(`[scan-dispatch] Failed to dispatch scan ${scanId} to worker:`, err);
  });

  return scanId;
}
