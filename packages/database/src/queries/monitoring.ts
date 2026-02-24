import type { Database } from '../schema';

type LogSourceInsert = Database['public']['Tables']['log_sources']['Insert'];
type LogSource = Database['public']['Tables']['log_sources']['Row'];
type IncidentUpsert = {
  source_id: string;
  url: string;
  source_page: string | null;
  status_code: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listLogSources(supabase: any, userId: string) {
  return supabase.from('log_sources').select('*').eq('user_id', userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLogSource(supabase: any, id: string) {
  return supabase.from('log_sources').select('*').eq('id', id).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createLogSource(supabase: any, data: LogSourceInsert) {
  return supabase.from('log_sources').insert(data).select().single();
}

export async function updateLogSource(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Partial<Pick<LogSource, 'name' | 'format'>>,
) {
  return supabase.from('log_sources').update(data).eq('id', id).select().single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteLogSource(supabase: any, id: string) {
  return supabase.from('log_sources').delete().eq('id', id);
}

export async function countLogSources(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('log_sources')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function upsertIncident(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  incident: IncidentUpsert,
) {
  // First try to find existing
  const { data: existing } = await supabase
    .from('link_incidents')
    .select('id, hits')
    .eq('source_id', incident.source_id)
    .eq('url', incident.url)
    .single();

  if (existing) {
    return supabase
      .from('link_incidents')
      .update({
        hits: existing.hits + 1,
        last_seen_at: new Date().toISOString(),
        source_page: incident.source_page,
        status_code: incident.status_code,
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    return supabase
      .from('link_incidents')
      .insert({
        ...incident,
        hits: 1,
      })
      .select()
      .single();
  }
}

export async function listIncidents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  filters?: { sourceId?: string; minHits?: number; statusCode?: number },
) {
  let query = supabase
    .from('link_incidents')
    .select('*, log_sources!inner(user_id)')
    .eq('log_sources.user_id', userId);

  if (filters?.sourceId) query = query.eq('source_id', filters.sourceId);
  if (filters?.minHits) query = query.gte('hits', filters.minHits);
  if (filters?.statusCode) query = query.eq('status_code', filters.statusCode);

  return query.order('hits', { ascending: false });
}

export async function getAllSourceApiKeyHashes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<Array<{ id: string; user_id: string; api_key_hash: string }>> {
  const { data } = await supabase
    .from('log_sources')
    .select('id, user_id, api_key_hash');
  return data ?? [];
}
