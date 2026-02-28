import { NextResponse } from 'next/server';
import { createAdminClient, getLatestHealthScore, getMonthlyStats } from '@linkrescue/database';
import { getUserPlan, getTierLimits, hasFeature } from '@linkrescue/types';
import { sendMonthlyHealthReport } from '@linkrescue/email';

export const maxDuration = 300;

// Triggered monthly by Vercel Cron (1st of each month)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all verified sites with user info
  type SiteWithUser = {
    id: string;
    user_id: string;
    domain: string;
    users: { id: string; stripe_price_id: string | null };
  };

  const { data: sites, error } = (await supabase
    .from('sites')
    .select('id, user_id, domain, users!inner(id, stripe_price_id)')
    .not('verified_at', 'is', null)) as unknown as {
    data: SiteWithUser[] | null;
    error: { message: string } | null;
  };

  if (error || !sites) {
    console.error('Failed to fetch sites for monthly report:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  // Calculate previous month range
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;

  for (const site of sites) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(site.user_id);
      if (!authUser?.user?.email) continue;

      const plan = getUserPlan(site.users?.stripe_price_id ?? null);
      const tierLimits = getTierLimits(plan);

      // Get health scores
      const { data: currentHealth } = await getLatestHealthScore(supabase, site.id);
      const healthScore = currentHealth?.score ?? 0;

      // Get previous month's health score
      const { data: prevHealthScores } = await supabase
        .from('site_health_scores')
        .select('score')
        .eq('site_id', site.id)
        .gte('recorded_at', prevMonthStr)
        .lt('recorded_at', thisMonth)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousHealthScore = prevHealthScores?.score ?? null;

      // Get this month's scan stats
      const { data: monthScans } = await supabase
        .from('scans')
        .select('pages_scanned, links_checked, status')
        .eq('site_id', site.id)
        .eq('status', 'completed')
        .gte('created_at', prevMonthStr)
        .lt('created_at', thisMonth);

      const scans = monthScans ?? [];
      const pagesScanned = scans.reduce((sum, s) => sum + (s.pages_scanned ?? 0), 0);
      const linksChecked = scans.reduce((sum, s) => sum + (s.links_checked ?? 0), 0);

      // Count issues found this month
      const { count: issuesFound } = await supabase
        .from('scan_results')
        .select('*', { count: 'exact', head: true })
        .in('scan_id', scans.map(s => s) as never[])
        .neq('issue_type', 'OK');

      // Estimated revenue saved (Pro/Agency only)
      let estimatedRevenueSaved: number | null = null;
      if (hasFeature(plan, 'revenue_estimates')) {
        const { data: revenue } = await supabase
          .from('revenue_history')
          .select('total_revenue_recovered_cents')
          .eq('user_id', site.user_id)
          .gte('date', prevMonthStr)
          .lt('date', thisMonth);

        estimatedRevenueSaved = (revenue ?? []).reduce(
          (sum, r) => sum + (r.total_revenue_recovered_cents ?? 0),
          0
        );
      }

      await sendMonthlyHealthReport(authUser.user.email, {
        domain: site.domain,
        siteId: site.id,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        pagesScanned,
        linksChecked,
        issuesFound: issuesFound ?? 0,
        issuesResolved: 0, // TODO: track resolved issues separately
        healthScore,
        previousHealthScore,
        estimatedRevenueSaved,
        planName: tierLimits.name,
        isFreePlan: plan === 'free',
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send monthly report for ${site.domain}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    message: `Monthly reports: ${sent} sent, ${failed} failed`,
    sent,
    failed,
  });
}
