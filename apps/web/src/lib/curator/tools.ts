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
