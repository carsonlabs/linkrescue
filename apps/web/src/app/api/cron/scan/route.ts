import { NextResponse } from 'next/server';
import { createAdminClient, computeNextRunAt } from '@linkrescue/database';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import type { ScanFrequency } from '@linkrescue/types';
import { dispatchScanWorker } from '@/lib/scan-dispatch';

export const maxDuration = 300; // 5 minutes for Vercel Pro

/** Scans stuck in 'running' for longer than this are marked failed. */
const STUCK_RUNNING_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/** Scans stuck in 'pending' (dispatch failed) for longer than this are marked failed. */
const STUCK_PENDING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// This endpoint is triggered by Vercel Cron hourly
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  // --- Stuck-scan recovery ---
  let stuckRecovered = 0;

  // Recover scans stuck in 'running' — atomic UPDATE with status guard
  const runningCutoff = new Date(Date.now() - STUCK_RUNNING_THRESHOLD_MS).toISOString();
  const { data: stuckRunning } = await supabase
    .from('scans')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: 'Scan timed out (stuck in running)',
    })
    .eq('status', 'running')
    .lt('started_at', runningCutoff)
    .select('id');

  stuckRecovered += stuckRunning?.length ?? 0;

  // Recover scans stuck in 'pending' — atomic UPDATE with status guard
  const pendingCutoff = new Date(Date.now() - STUCK_PENDING_THRESHOLD_MS).toISOString();
  const { data: stuckPending } = await supabase
    .from('scans')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: 'Scan timed out (stuck in pending — dispatch may have failed)',
    })
    .eq('status', 'pending')
    .lt('created_at', pendingCutoff)
    .select('id');

  stuckRecovered += stuckPending?.length ?? 0;

  if (stuckRecovered > 0) {
    console.log(`[cron/scan] Recovered ${stuckRecovered} stuck scans`);
  }

  // --- Regular scans ---
  type SiteWithUser = {
    id: string;
    user_id: string;
    domain: string;
    sitemap_url: string | null;
    verified_at: string | null;
    created_at: string;
    verify_token: string;
    crawl_exclusions: string[];
    users: { id: string; stripe_price_id: string | null };
  };
  const { data: sites, error } = (await supabase
    .from('sites')
    .select('*, users!inner(id, stripe_price_id)')
    .not('verified_at', 'is', null)) as unknown as {
    data: SiteWithUser[] | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  if (!sites || sites.length === 0) {
    return NextResponse.json({ message: 'No verified sites to scan', stuckRecovered });
  }

  let dispatched = 0;
  let skipped = 0;

  // Dispatch scans sequentially (dispatchScanWorker checks for active scans)
  for (const site of sites) {
    const userProfile = site.users;
    const plan = getUserPlan(userProfile?.stripe_price_id ?? null);
    const limits = getPlanLimits(plan);

    const scanId = await dispatchScanWorker({
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages: limits.pagesPerScan,
      crawlExclusions: site.crawl_exclusions ?? [],
      userId: site.user_id,
      triggerSource: 'cron',
    });

    if (scanId) {
      dispatched++;
    } else {
      skipped++;
    }
  }

  // --- Schedule-based scans ---
  type ScheduleRow = {
    id: string;
    site_id: string;
    frequency: ScanFrequency;
    next_run_at: string;
    sites: {
      id: string;
      user_id: string;
      domain: string;
      sitemap_url: string | null;
      verified_at: string | null;
      crawl_exclusions: string[];
      users: { id: string; stripe_price_id: string | null };
    };
  };

  const { data: dueSchedules } = (await supabase
    .from('scan_schedules')
    .select('*, sites!inner(id, user_id, domain, sitemap_url, verified_at, crawl_exclusions, users!inner(id, stripe_price_id))')
    .lte('next_run_at', new Date().toISOString())) as unknown as {
    data: ScheduleRow[] | null;
  };

  for (const schedule of dueSchedules ?? []) {
    const site = schedule.sites;
    if (!site.verified_at) continue;

    const plan = getUserPlan(site.users?.stripe_price_id ?? null);
    const limits = getPlanLimits(plan);

    const scanId = await dispatchScanWorker({
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages: limits.pagesPerScan,
      crawlExclusions: site.crawl_exclusions ?? [],
      userId: site.user_id,
      triggerSource: 'schedule',
    });

    if (scanId) dispatched++;
    else skipped++;

    // Update next_run_at regardless of outcome
    const nextRunAt = computeNextRunAt(schedule.frequency);
    await supabase
      .from('scan_schedules')
      .update({ next_run_at: nextRunAt, updated_at: new Date().toISOString() })
      .eq('id', schedule.id);
  }

  return NextResponse.json({
    message: `Dispatched ${dispatched} scans, skipped ${skipped}`,
    dispatched,
    skipped,
    stuckRecovered,
  });
}
