import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';

export async function getScansBySiteId(
  supabase: SupabaseClient<Database>,
  siteId: string
) {
  return supabase.from('scans').select('*').eq('site_id', siteId);
}

// TODO: Add more query functions as needed
