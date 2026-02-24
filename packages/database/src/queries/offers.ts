import type { Database } from '../schema';

type Offer = Database['public']['Tables']['offers']['Row'];
type OfferInsert = Database['public']['Tables']['offers']['Insert'];

export async function listOffers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  topic?: string,
) {
  let query = supabase.from('offers').select('*').eq('user_id', userId);
  if (topic) query = query.eq('topic', topic);
  return query.order('created_at', { ascending: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOffer(supabase: any, id: string) {
  return supabase.from('offers').select('*').eq('id', id).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOffer(supabase: any, data: OfferInsert) {
  return supabase.from('offers').insert(data).select().single();
}

export async function updateOffer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Partial<Omit<Offer, 'id' | 'user_id' | 'created_at'>>,
) {
  return supabase
    .from('offers')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteOffer(supabase: any, id: string) {
  return supabase.from('offers').delete().eq('id', id);
}

export async function countOffers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function bulkInsertOffers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  rows: OfferInsert[],
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error, data } = await supabase.from('offers').insert(batch).select();
    if (error) {
      errors.push(error.message);
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return { inserted, errors };
}
