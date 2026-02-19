import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';

export async function getLinksByPageId(
  supabase: SupabaseClient<Database>,
  pageId: string
) {
  return supabase.from('links').select('*').eq('page_id', pageId);
}

// TODO: Add more query functions as needed
