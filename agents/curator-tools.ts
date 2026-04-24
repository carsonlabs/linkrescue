// linkrescue/agents/curator-tools.ts
// Read/write helpers the Curator Managed Agent calls. Scoped to one
// userId — every tool accepts the user id and returns only that user's data.
// Uses the service-role key because the agent runs out-of-band from the
// user's session; RLS is enforced by explicit WHERE user_id = ? clauses.

import { createClient } from '@supabase/supabase-js';

const app = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getRecentIssues(userId: string) {
  const { data, error } = await app
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

export async function getDismissals(userId: string) {
  const { data, error } = await app
    .from('issue_dismissals')
    .select('pattern_host, link_id, issue_type, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function getMatchOutcomes(userId: string) {
  const { data, error } = await app
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
 * Cross-user rot-rate benchmarks. Service-role query across all users;
 * returns top-volume hosts + the calling user's rates + any hosts where
 * the user's rate is ≥1.5× network average.
 */
export async function getNetworkBenchmarks(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await app
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

export async function getHealthTrends(userId: string) {
  const { data: sites } = await app
    .from('sites')
    .select('id, domain')
    .eq('user_id', userId);

  if (!sites || sites.length === 0) return [];

  const siteIds = sites.map((s) => s.id);
  const { data } = await app
    .from('site_health_scores')
    .select('site_id, score, recorded_at')
    .in('site_id', siteIds)
    .order('recorded_at', { ascending: false })
    .limit(90);

  const byDomain = new Map(sites.map((s) => [s.id, s.domain]));
  return (data ?? []).map((h) => ({
    domain: byDomain.get(h.site_id) ?? null,
    score: h.score,
    recorded_at: h.recorded_at,
  }));
}

export async function publishInsight(args: {
  user_id: string;
  kind: 'summary' | 'recommendation' | 'alert_suppression' | 'program_risk';
  headline: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await app
    .from('curator_insights')
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
  return data;
}

export async function markCuratorRun(userId: string) {
  const { error } = await app
    .from('users')
    .update({ curator_last_run_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function getOrCreateMemoryStoreId(
  userId: string,
  createStore: () => Promise<string>,
): Promise<string> {
  const { data: row, error } = await app
    .from('users')
    .select('curator_memory_store_id')
    .eq('id', userId)
    .single();
  if (error) throw error;

  if (row?.curator_memory_store_id) return row.curator_memory_store_id;

  const storeId = await createStore();
  const { error: upErr } = await app
    .from('users')
    .update({ curator_memory_store_id: storeId })
    .eq('id', userId);
  if (upErr) throw upErr;
  return storeId;
}

function safeHost(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
}
