import type { Database, MatchStatus } from '../schema';

type MatchInsert = Database['public']['Tables']['matches']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listMatchesByScan(supabase: any, scanId: string) {
  return supabase
    .from('matches')
    .select('*, offers(*), scan_results!inner(scan_id)')
    .eq('scan_results.scan_id', scanId)
    .order('match_score', { ascending: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMatch(supabase: any, id: string) {
  return supabase.from('matches').select('*').eq('id', id).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMatch(supabase: any, data: MatchInsert) {
  return supabase.from('matches').insert(data).select().single();
}

export async function updateMatchStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  status: MatchStatus,
) {
  return supabase.from('matches').update({ status }).eq('id', id).select().single();
}

export async function listUnmatchedBrokenResults(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  scanId: string,
  limit: number,
) {
  // Get broken scan results that have no matches yet
  return supabase
    .from('scan_results')
    .select('*, links(*)')
    .eq('scan_id', scanId)
    .not('issue_type', 'eq', 'OK')
    .not('id', 'in', `(SELECT DISTINCT scan_result_id FROM matches)`)
    .limit(limit);
}
