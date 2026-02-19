import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

export async function getPagesBySiteId(supabase: DbClient, siteId: string) {
  return supabase.from('pages').select('*').eq('site_id', siteId);
}

export async function upsertPage(
  supabase: DbClient,
  data: { site_id: string; url: string }
) {
  return supabase
    .from('pages')
    .upsert(data, { onConflict: 'site_id,url' })
    .select()
    .single();
}

export async function updatePageFetchedAt(supabase: DbClient, pageId: string) {
  return supabase
    .from('pages')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('id', pageId);
}
