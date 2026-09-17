import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserScoreboard, NetworkStatsPublic } from '@linkrescue/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

function isMissingRelationError(error: { code?: string }) {
  // Postgres returns 42P01 when the relation is missing. PostgREST returns
  // PGRST205 when the same relation is absent from its schema cache.
  return error.code === '42P01' || error.code === 'PGRST205';
}

// Re-export pure types/helpers so callers in the web app only need one import.
export {
  estimateValueCents,
  formatCents,
  formatCentsCompact,
  formatCentsWhole,
  monthOverMonthDelta,
  type EstimatorTier,
  type IssueTypeKey,
  type EstimateValueArgs,
  type UserScoreboard,
  type NetworkStatsPublic,
  type MoMDelta,
} from '@linkrescue/types';

/** Fetch the scoreboard row for the authenticated user. Null if no row exists yet. */
export async function getUserScoreboard(
  supabase: DbClient,
  userId: string
): Promise<UserScoreboard | null> {
  const { data, error } = await supabase
    .from('user_scoreboard')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // View may not exist yet (migration unapplied) — fail soft so the dashboard still renders.
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  return (data as UserScoreboard | null) ?? null;
}

/** Public aggregate stats for the homepage counter. No auth required. */
export async function getNetworkStatsPublic(
  supabase: DbClient
): Promise<NetworkStatsPublic | null> {
  const { data, error } = await supabase
    .from('network_stats_public')
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  return (data as NetworkStatsPublic | null) ?? null;
}

/**
 * Mark an issue resolved (e.g. when a redirect deploys or guardian rescues).
 * Idempotent.
 */
export async function markIssueResolved(
  supabase: DbClient,
  scanResultId: string,
  kind: 'redirect_deployed' | 'guardian_rescued' | 'manual_fix' | 'auto_recovered'
) {
  return supabase.rpc('mark_issue_resolved', {
    p_scan_result_id: scanResultId,
    p_resolution_kind: kind,
  });
}
