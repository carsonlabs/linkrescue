import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';

type DbClient = SupabaseClient<Database>;

export async function getLinksByPageId(supabase: DbClient, pageId: string) {
  return supabase.from('links').select('*').eq('page_id', pageId);
}

export async function getLinksBySiteId(supabase: DbClient, siteId: string) {
  return supabase.from('links').select('*').eq('site_id', siteId);
}

export async function upsertLink(
  supabase: DbClient,
  data: { site_id: string; page_id: string; href: string; is_affiliate: boolean }
) {
  return supabase
    .from('links')
    .upsert(data, { onConflict: 'page_id,href' })
    .select()
    .single();
}

export async function getIssuesForSite(
  supabase: DbClient,
  siteId: string,
  options?: { issueType?: string; search?: string; limit?: number; offset?: number }
) {
  let query = supabase
    .from('scan_results')
    .select(`
      *,
      link:links!inner(id, href, is_affiliate, page:pages!inner(url)),
      scan:scans!inner(site_id)
    `)
    .eq('scan:scans.site_id' as never, siteId as never)
    .neq('issue_type', 'OK');

  if (options?.issueType) {
    query = query.eq('issue_type', options.issueType);
  }
  if (options?.search) {
    query = query.ilike('link.href' as never, `%${options.search}%` as never);
  }
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  query = query.range(offset, offset + limit - 1).order('checked_at', { ascending: false });

  return query;
}
