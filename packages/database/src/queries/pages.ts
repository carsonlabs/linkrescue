import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';

export async function getPagesBySiteId(
  supabase: SupabaseClient<Database>,
  siteId: string
) {
  return supabase.from('pages').select('*').eq('site_id', siteId);
}

// TODO: Add more query functions as needed
