import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits, hasFeature, type TierName } from '@linkrescue/types';
import { runScan } from '@linkrescue/crawler';
import { createAdminClient, computeHealthScore, upsertHealthScore } from '@linkrescue/database';
import { dispatchWebhook } from '@/lib/webhooks';
import { notifySlack, formatScanComplete } from '@/lib/slack';

export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (!site.verified_at) {
    return NextResponse.json({ error: 'Site must be verified before scanning' }, { status: 403 });
  }

  // Check plan limits
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null) as TierName;
  const limits = getPlanLimits(plan);

  // Check if plan allows on-demand scans
  if (!hasFeature(plan, 'on_demand_scans')) {
    return NextResponse.json(
      { error: 'On-demand scanning requires a paid plan. Upgrade to Pro or Agency.' },
      { status: 403 }
    );
  }

  // Rate limiting: check last manual scan for this site
  const cooldownSeconds = limits.manualScanCooldownSeconds;
  if (cooldownSeconds > 0) {
    const { data: lastScan } = await supabase
      .from('scans')
      .select('created_at')
      .eq('site_id', site.id)
      .in('status', ['running', 'pending'])
      .limit(1)
      .maybeSingle();

    // Block if a scan is already running
    if (lastScan) {
      return NextResponse.json(
        { error: 'A scan is already in progress for this site.' },
        { status: 429 }
      );
    }

    const { data: recentScan } = await supabase
      .from('scans')
      .select('created_at')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentScan) {
      const elapsed = (Date.now() - new Date(recentScan.created_at).getTime()) / 1000;
      if (elapsed < cooldownSeconds) {
        const waitMinutes = Math.ceil((cooldownSeconds - elapsed) / 60);
        return NextResponse.json(
          { error: `Rate limited. Try again in ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''}.` },
          { status: 429 }
        );
      }
    }
  }

  // Run scan with admin client (bypasses RLS for writes)
  const adminDb = createAdminClient();

  try {
    const scanResult = await runScan({
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages: limits.pagesPerScan,
      supabase: adminDb,
    });

    // Compute and store health score after scan
    try {
      const healthComponents = await computeHealthScore(adminDb, site.id, limits.pagesPerScan);
      await upsertHealthScore(adminDb, site.id, healthComponents);
    } catch (healthErr) {
      console.error(`Failed to compute health score for ${site.domain}:`, healthErr);
    }

    // Fire scan.completed webhook + Slack notification
    dispatchWebhook(user.id, 'scan.completed', {
      siteId: site.id,
      domain: site.domain,
      scanId: scanResult.scanId,
      pagesScanned: scanResult.pagesScanned,
      linksChecked: scanResult.linksChecked,
    }).catch(() => {});

    notifySlack(
      user.id,
      'scan',
      formatScanComplete(site.domain, scanResult.pagesScanned, scanResult.linksChecked, 0),
    ).catch(() => {});

    return NextResponse.json({
      message: 'Scan completed',
      scanId: scanResult.scanId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
