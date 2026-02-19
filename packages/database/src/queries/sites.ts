import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

export async function getSitesByUserId(supabase: DbClient, userId: string) {
  return supabase.from('sites').select('*').eq('user_id', userId);
}

export async function getSiteById(supabase: DbClient, siteId: string) {
  return supabase.from('sites').select('*').eq('id', siteId).single();
}

export async function createSite(
  supabase: DbClient,
  data: { user_id: string; domain: string; sitemap_url?: string | null }
) {
  return supabase.from('sites').insert(data).select().single();
}

export async function verifySite(supabase: DbClient, siteId: string) {
  return supabase
    .from('sites')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', siteId)
    .select()
    .single();
}

export async function getVerifiedSites(supabase: DbClient) {
  return supabase.from('sites').select('*').not('verified_at', 'is', null);
}

export async function countUserSites(supabase: DbClient, userId: string) {
  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function deleteSite(supabase: DbClient, siteId: string) {
  return supabase.from('sites').delete().eq('id', siteId);
}
