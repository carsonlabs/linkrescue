import type { SupabaseClient } from '@supabase/supabase-js';
import type { IssueType } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

export async function getScansBySiteId(supabase: DbClient, siteId: string) {
  return supabase
    .from('scans')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
}

export async function getLatestScan(supabase: DbClient, siteId: string) {
  return supabase
    .from('scans')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function createScan(supabase: DbClient, siteId: string) {
  return supabase
    .from('scans')
    .insert({
      site_id: siteId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
}

export async function completeScan(
  supabase: DbClient,
  scanId: string,
  data: { pages_scanned: number; links_checked: number }
) {
  return supabase
    .from('scans')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      pages_scanned: data.pages_scanned,
      links_checked: data.links_checked,
    })
    .eq('id', scanId);
}

export async function failScan(supabase: DbClient, scanId: string, error: string) {
  return supabase
    .from('scans')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: error,
    })
    .eq('id', scanId);
}

export async function addScanResult(
  supabase: DbClient,
  data: {
    scan_id: string;
    link_id: string;
    status_code: number | null;
    final_url: string | null;
    redirect_hops: number;
    issue_type: IssueType;
  }
) {
  return supabase.from('scan_results').insert(data);
}

export async function addScanEvent(
  supabase: DbClient,
  data: { scan_id: string; level: string; message: string }
) {
  return supabase.from('scan_events').insert(data);
}

export async function getIssueCountsForSite(supabase: DbClient, siteId: string) {
  const { data: latestScan } = await getLatestScan(supabase, siteId);
  if (!latestScan) return { total: 0, byType: {} as Record<string, number> };

  const { data: results } = await supabase
    .from('scan_results')
    .select('issue_type')
    .eq('scan_id', latestScan.id)
    .neq('issue_type', 'OK');

  if (!results) return { total: 0, byType: {} as Record<string, number> };

  const byType: Record<string, number> = {};
  for (const r of results) {
    byType[r.issue_type] = (byType[r.issue_type] || 0) + 1;
  }
  return { total: results.length, byType };
}
