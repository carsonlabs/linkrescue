import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';

export async function getSitesByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  return supabase.from('sites').select('*').eq('user_id', userId);
}

export async function getSiteById(
  supabase: SupabaseClient<Database>,
  siteId: string
) {
  return supabase.from('sites').select('*').eq('id', siteId).single();
}

// TODO: Add more query functions as needed
