import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getHealthScoreHistory, getLatestHealthScore } from '@linkrescue/database';
import { HealthScoreGauge } from '@/components/dashboard/health-score-gauge';
import { TrendCharts } from './trend-charts';
import { Activity, TrendingUp, Link2, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Get user's sites
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .not('verified_at', 'is', null)
    .order('created_at', { ascending: false });

  if (!sites || sites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Trends</h1>
          <p className="text-slate-400 text-sm mt-1">Track your link health over time.</p>
        </div>
        <div className="glass-card p-12 text-center">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No data yet</h3>
          <p className="text-sm text-slate-400">
            Verify a site and run at least one scan to see trends.
          </p>
        </div>
      </div>
    );
  }

  // Aggregate health scores across all sites
  const siteScores = await Promise.all(
    sites.map(async (site) => {
      const { data: latest } = await getLatestHealthScore(supabase, site.id);
      const { data: history30 } = await getHealthScoreHistory(supabase, site.id, 30);
      const { data: history90 } = await getHealthScoreHistory(supabase, site.id, 90);
      return {
        site,
        latestScore: latest?.score ?? null,
        history30: history30 ?? [],
        history90: history90 ?? [],
      };
    })
  );

  // Overall health score (average across sites)
  const sitesWithScores = siteScores.filter((s) => s.latestScore !== null);
  const avgScore = sitesWithScores.length > 0
    ? Math.round(sitesWithScores.reduce((sum, s) => sum + (s.latestScore ?? 0), 0) / sitesWithScores.length)
    : 0;

  // Get previous score for trend
  const prevScores = sitesWithScores
    .map((s) => s.history30.length >= 2 ? s.history30[s.history30.length - 2]?.score : null)
    .filter((s): s is number => s !== null);
  const prevAvg = prevScores.length > 0
    ? Math.round(prevScores.reduce((sum, s) => sum + s, 0) / prevScores.length)
    : null;

  // Aggregate stats from scans
  const { data: recentScans } = await supabase
    .from('scans')
    .select('pages_scanned, links_checked, site_id, created_at')
    .eq('status', 'completed')
    .in('site_id', sites.map((s) => s.id))
    .order('created_at', { ascending: false })
    .limit(100);

  const totalLinksMonitored = (recentScans ?? []).reduce((sum, s) => sum + (s.links_checked ?? 0), 0);
  const totalPagesScanned = (recentScans ?? []).reduce((sum, s) => sum + (s.pages_scanned ?? 0), 0);

  // Get total issues caught (across all time)
  const { count: totalIssuesCaught } = await supabase
    .from('scan_results')
    .select('*', { count: 'exact', head: true })
    .neq('issue_type', 'OK');

  // Get monthly broken link counts for chart
  const { data: monthlyIssues } = await supabase
    .from('scan_results')
    .select('checked_at, issue_type')
    .neq('issue_type', 'OK')
    .order('checked_at', { ascending: true });

  // Group by month
  const monthlyBrokenCounts: Record<string, number> = {};
  for (const issue of monthlyIssues ?? []) {
    const month = issue.checked_at.substring(0, 7); // YYYY-MM
    monthlyBrokenCounts[month] = (monthlyBrokenCounts[month] || 0) + 1;
  }

  // Get affiliate program rot rates
  const { data: affiliateIssues } = await supabase
    .from('scan_results')
    .select('issue_type, links!inner(href, is_affiliate)')
    .neq('issue_type', 'OK')
    .eq('links.is_affiliate', true)
    .limit(500);

  // Group by domain
  const programRot: Record<string, { total: number; broken: number }> = {};
  for (const issue of affiliateIssues ?? []) {
    const link = issue.links as unknown as { href: string };
    try {
      const domain = new URL(link.href).hostname;
      if (!programRot[domain]) programRot[domain] = { total: 0, broken: 0 };
      programRot[domain].total++;
      programRot[domain].broken++;
    } catch {
      // skip invalid URLs
    }
  }

  const topRotPrograms = Object.entries(programRot)
    .sort((a, b) => b[1].broken - a[1].broken)
    .slice(0, 10)
    .map(([domain, data]) => ({ domain, ...data }));

  // Prepare chart data
  const healthChartData = siteScores[0]?.history90.map((h) => ({
    date: h.recorded_at,
    score: h.score,
  })) ?? [];

  const brokenChartData = Object.entries(monthlyBrokenCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Trends</h1>
        <p className="text-slate-400 text-sm mt-1">Track your link health over time.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Health Score</p>
            <p className="font-display text-2xl font-bold text-gradient">{avgScore}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Links Monitored</p>
            <p className="font-display text-2xl font-bold">
              {totalLinksMonitored >= 1000 ? `${(totalLinksMonitored / 1000).toFixed(1)}K` : totalLinksMonitored}
            </p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Issues Caught</p>
            <p className="font-display text-2xl font-bold">{totalIssuesCaught ?? 0}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pages Scanned</p>
            <p className="font-display text-2xl font-bold">
              {totalPagesScanned >= 1000 ? `${(totalPagesScanned / 1000).toFixed(1)}K` : totalPagesScanned}
            </p>
          </div>
        </div>
      </div>

      {/* Charts — client component */}
      <TrendCharts
        healthChartData={healthChartData}
        brokenChartData={brokenChartData}
        topRotPrograms={topRotPrograms}
        siteScores={siteScores.map((s) => ({
          domain: s.site.domain,
          siteId: s.site.id,
          score: s.latestScore,
        }))}
      />
    </div>
  );
}
