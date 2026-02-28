import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

export interface HealthScoreComponents {
  healthyLinkRatio: number;
  scanCoverage: number;
  daysSinceCritical: number;
  affiliateParamIntegrity: number;
  score: number;
}

/**
 * Compute health score for a site based on its latest scan data.
 *
 * Formula (0-100):
 *  - Healthy link ratio (40%): % of links that are OK
 *  - Scan coverage (20%): pages scanned / expected pages (capped at 1)
 *  - Days since last critical issue (20%): more days = higher score
 *  - Affiliate param integrity (20%): % of affiliate links without LOST_PARAMS
 */
export async function computeHealthScore(
  supabase: DbClient,
  siteId: string,
  expectedPages: number = 200
): Promise<HealthScoreComponents> {
  // Get latest completed scan
  const { data: latestScan } = await supabase
    .from('scans')
    .select('id, pages_scanned, links_checked')
    .eq('site_id', siteId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestScan) {
    return { healthyLinkRatio: 0, scanCoverage: 0, daysSinceCritical: 0, affiliateParamIntegrity: 1, score: 0 };
  }

  // Get all results from latest scan
  const { data: results } = await supabase
    .from('scan_results')
    .select('issue_type, link_id')
    .eq('scan_id', latestScan.id);

  const allResults = results ?? [];
  const totalLinks = allResults.length;

  // 1. Healthy link ratio (40%)
  const okLinks = allResults.filter((r) => r.issue_type === 'OK').length;
  const healthyLinkRatio = totalLinks > 0 ? okLinks / totalLinks : 1;

  // 2. Scan coverage (20%) — pages scanned vs expected
  const scanCoverage = Math.min(1, (latestScan.pages_scanned ?? 0) / expectedPages);

  // 3. Days since last critical issue (20%)
  // Critical = BROKEN_4XX or SERVER_5XX
  const { data: lastCritical } = await supabase
    .from('scan_results')
    .select('checked_at, scans!inner(site_id)')
    .in('issue_type', ['BROKEN_4XX', 'SERVER_5XX'])
    .eq('scans.site_id', siteId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let daysSinceCriticalScore: number;
  if (!lastCritical) {
    daysSinceCriticalScore = 1; // No critical issues ever = perfect score
  } else {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCritical.checked_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    // Score: 0 days = 0, 30+ days = 1, linear between
    daysSinceCriticalScore = Math.min(1, daysSince / 30);
  }

  // 4. Affiliate param integrity (20%)
  // Get affiliate links from the latest scan and check for LOST_PARAMS
  const { data: affiliateResults } = await supabase
    .from('scan_results')
    .select('issue_type, links!inner(is_affiliate)')
    .eq('scan_id', latestScan.id)
    .eq('links.is_affiliate', true);

  const affiliateLinks = affiliateResults ?? [];
  let affiliateParamIntegrity: number;
  if (affiliateLinks.length === 0) {
    affiliateParamIntegrity = 1; // No affiliate links = no integrity issues
  } else {
    const lostParams = affiliateLinks.filter((r) => r.issue_type === 'LOST_PARAMS').length;
    affiliateParamIntegrity = 1 - lostParams / affiliateLinks.length;
  }

  // Weighted score
  const score = Math.round(
    healthyLinkRatio * 40 +
    scanCoverage * 20 +
    daysSinceCriticalScore * 20 +
    affiliateParamIntegrity * 20
  );

  return {
    healthyLinkRatio,
    scanCoverage,
    daysSinceCritical: daysSinceCriticalScore,
    affiliateParamIntegrity,
    score: Math.max(0, Math.min(100, score)),
  };
}

/** Save a health score snapshot for today (upserts on site_id + date) */
export async function upsertHealthScore(
  supabase: DbClient,
  siteId: string,
  components: HealthScoreComponents
) {
  return supabase
    .from('site_health_scores')
    .upsert(
      {
        site_id: siteId,
        score: components.score,
        healthy_link_ratio: components.healthyLinkRatio,
        scan_coverage: components.scanCoverage,
        days_since_critical: Math.round(components.daysSinceCritical * 30),
        affiliate_param_integrity: components.affiliateParamIntegrity,
        recorded_at: new Date().toISOString().split('T')[0],
      },
      { onConflict: 'site_id,recorded_at' }
    );
}

/** Get health score history for a site (for trend charts) */
export async function getHealthScoreHistory(
  supabase: DbClient,
  siteId: string,
  days: number = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return supabase
    .from('site_health_scores')
    .select('score, recorded_at')
    .eq('site_id', siteId)
    .gte('recorded_at', since.toISOString().split('T')[0])
    .order('recorded_at', { ascending: true });
}

/** Get the latest health score for a site */
export async function getLatestHealthScore(supabase: DbClient, siteId: string) {
  return supabase
    .from('site_health_scores')
    .select('*')
    .eq('site_id', siteId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

/** Get monthly stats for trend dashboard */
export async function getMonthlyStats(
  supabase: DbClient,
  siteId: string,
  months: number = 6
) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceMonth = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-01`;

  return supabase
    .from('monthly_site_stats')
    .select('*')
    .eq('site_id', siteId)
    .gte('month', sinceMonth)
    .order('month', { ascending: true });
}

/** Upsert monthly aggregated stats */
export async function upsertMonthlyStats(
  supabase: DbClient,
  siteId: string,
  data: {
    month: string;
    totalLinksChecked: number;
    totalIssuesFound: number;
    totalIssuesResolved: number;
    brokenLinkCount: number;
    affiliateIssuesCount: number;
    pagesScanned: number;
    scansCompleted: number;
    avgHealthScore: number | null;
  }
) {
  return supabase
    .from('monthly_site_stats')
    .upsert(
      {
        site_id: siteId,
        month: data.month,
        total_links_checked: data.totalLinksChecked,
        total_issues_found: data.totalIssuesFound,
        total_issues_resolved: data.totalIssuesResolved,
        broken_link_count: data.brokenLinkCount,
        affiliate_issues_count: data.affiliateIssuesCount,
        pages_scanned: data.pagesScanned,
        scans_completed: data.scansCompleted,
        avg_health_score: data.avgHealthScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id,month' }
    );
}
