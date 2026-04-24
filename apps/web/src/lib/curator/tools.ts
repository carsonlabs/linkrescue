// Web-side mirror of agents/curator-tools.ts — same shape, but uses the
// shared @linkrescue/database admin client so the cron dispatcher can call
// it directly without duplicating Supabase plumbing.

import { createAdminClient } from '@linkrescue/database';

type Admin = ReturnType<typeof createAdminClient>;

function safeHost(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function getRecentIssues(admin: Admin, userId: string) {
  const { data, error } = await admin
    .from('scan_results')
    .select(
      `id, issue_type, status_code, checked_at,
       link:links!inner(id, href, is_affiliate,
         site:sites!inner(user_id, domain),
         page:pages!inner(url))`,
    )
    .eq('link.site.user_id', userId)
    .neq('issue_type', 'OK')
    .order('checked_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    issue_type: r.issue_type,
    status_code: r.status_code,
    href: r.link?.href,
    host: safeHost(r.link?.href),
    page_url: r.link?.page?.url,
    domain: r.link?.site?.domain,
    is_affiliate: r.link?.is_affiliate,
    checked_at: r.checked_at,
  }));
}

export async function getDismissals(admin: Admin, userId: string) {
  const { data, error } = await admin
    .from('issue_dismissals')
    .select('pattern_host, link_id, issue_type, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function getMatchOutcomes(admin: Admin, userId: string) {
  const { data, error } = await admin
    .from('matches')
    .select(
      `status, match_score, created_at,
       offers!inner(title, topic, tags, user_id)`,
    )
    .eq('offers.user_id', userId)
    .in('status', ['applied', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    status: m.status,
    score: m.match_score,
    title: m.offers?.title,
    topic: m.offers?.topic,
    tags: m.offers?.tags,
    created_at: m.created_at,
  }));
}

/**
 * Cross-user rot-rate benchmarks. Service-role query, so aggregates over
 * EVERY user's scan_results in the last 30 days. Used by the Curator to
 * say "your CJ links rot 4× the network average" with real data.
 *
 * Returns:
 *  - network_averages: top hosts by volume across all users, with rot rate
 *  - user_rates: the calling user's rates per host
 *  - anomalies: hosts where the user's rate is ≥1.5× the network average,
 *    with enough sample size on both sides. Sorted by severity.
 */
export async function getNetworkBenchmarks(admin: Admin, userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('scan_results')
    .select('issue_type, link:links!inner(href, site:sites!inner(user_id))')
    .gte('checked_at', since)
    .limit(50000);
  if (error) throw error;

  const rootHost = (href: string): string | null => {
    try {
      const h = new URL(href).hostname.toLowerCase();
      const parts = h.split('.');
      return parts.length >= 2 ? parts.slice(-2).join('.') : h;
    } catch {
      return null;
    }
  };

  type Bucket = { total: number; broken: number };
  const network = new Map<string, Bucket>();
  const user = new Map<string, Bucket>();

  for (const row of data ?? []) {
    const link: any = Array.isArray((row as any).link) ? (row as any).link[0] : (row as any).link;
    const host = rootHost(link?.href ?? '');
    if (!host) continue;

    const n = network.get(host) ?? { total: 0, broken: 0 };
    n.total++;
    if (row.issue_type !== 'OK') n.broken++;
    network.set(host, n);

    const site = Array.isArray(link?.site) ? link.site[0] : link?.site;
    if (site?.user_id === userId) {
      const u = user.get(host) ?? { total: 0, broken: 0 };
      u.total++;
      if (row.issue_type !== 'OK') u.broken++;
      user.set(host, u);
    }
  }

  const networkAverages = Array.from(network.entries())
    .filter(([, b]) => b.total >= 50)
    .map(([host, b]) => ({
      host,
      network_checks: b.total,
      network_rot_rate: +(b.broken / b.total).toFixed(4),
    }))
    .sort((a, b) => b.network_checks - a.network_checks)
    .slice(0, 20);

  const userRates = Array.from(user.entries())
    .filter(([, b]) => b.total >= 5)
    .map(([host, b]) => ({
      host,
      user_checks: b.total,
      user_rot_rate: +(b.broken / b.total).toFixed(4),
    }))
    .sort((a, b) => b.user_checks - a.user_checks)
    .slice(0, 20);

  const anomalies = userRates
    .map((u) => {
      const n = network.get(u.host);
      if (!n || n.total < 50) return null;
      const network_rot = n.broken / n.total;
      if (network_rot === 0 && u.user_rot_rate === 0) return null;
      const ratio = network_rot > 0 ? u.user_rot_rate / network_rot : Infinity;
      return {
        host: u.host,
        user_rot_rate: u.user_rot_rate,
        network_rot_rate: +network_rot.toFixed(4),
        ratio: isFinite(ratio) ? +ratio.toFixed(2) : null,
        user_checks: u.user_checks,
        network_checks: n.total,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .filter((x) => x.ratio !== null && x.ratio >= 1.5)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));

  return {
    window_days: 30,
    total_user_checks: Array.from(user.values()).reduce((s, b) => s + b.total, 0),
    total_network_checks: Array.from(network.values()).reduce((s, b) => s + b.total, 0),
    network_averages: networkAverages,
    user_rates: userRates,
    anomalies,
  };
}

export async function getHealthTrends(admin: Admin, userId: string) {
  const { data: sites } = await admin
    .from('sites')
    .select('id, domain')
    .eq('user_id', userId);
  if (!sites || sites.length === 0) return [];
  const siteIds = sites.map((s: any) => s.id);
  const { data } = await admin
    .from('site_health_scores')
    .select('site_id, score, recorded_at')
    .in('site_id', siteIds)
    .order('recorded_at', { ascending: false })
    .limit(90);
  const byDomain = new Map<string, string>(sites.map((s: any) => [s.id, s.domain] as const));
  return (data ?? []).map((h: any) => ({
    domain: byDomain.get(h.site_id) ?? null,
    score: h.score,
    recorded_at: h.recorded_at,
  }));
}

export async function publishInsight(
  admin: Admin,
  args: {
    user_id: string;
    kind: 'summary' | 'recommendation' | 'alert_suppression' | 'program_risk';
    headline: string;
    body?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  // curator_insights is added by migrations/memory_phase3_curator.sql —
  // generated Supabase types lag until `supabase gen types` re-runs, so cast
  // through any at the DSL boundary.
  const { data, error } = await (admin.from('curator_insights') as any)
    .insert({
      user_id: args.user_id,
      kind: args.kind,
      headline: args.headline,
      body: args.body ?? null,
      metadata: args.metadata ?? {},
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function markCuratorRun(admin: Admin, userId: string) {
  const { error } = await admin
    // Stamps the curator_last_run_at column added by memory_phase3_curator.sql.
    .from('users')
    .update({ curator_last_run_at: new Date().toISOString() } as any)
    .eq('id', userId);
  if (error) throw error;
}

export async function getOrCreateMemoryStoreId(
  admin: Admin,
  userId: string,
  createStore: () => Promise<string>,
): Promise<string> {
  const { data: row, error } = await admin
    .from('users')
    .select('curator_memory_store_id' as any)
    .eq('id', userId)
    .single();
  if (error) throw error;
  const existing = (row as any)?.curator_memory_store_id as string | null;
  if (existing) return existing;

  const storeId = await createStore();
  const { error: upErr } = await admin
    .from('users')
    .update({ curator_memory_store_id: storeId } as any)
    .eq('id', userId);
  if (upErr) throw upErr;
  return storeId;
}
