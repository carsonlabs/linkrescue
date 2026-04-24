import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserPreferences } from '@linkrescue/ai';

const RECENT_LIMIT = 50;
const HOST_CAP = 20;
const REASON_CAP = 8;

/**
 * Builds a compact preference summary from the user's match outcomes and
 * dismissal patterns. Passed into matchOffers so Claude biases toward
 * historically-preferred offers and away from rejected ones.
 *
 * Safe for parallel invocation — read-only queries scoped by user_id/RLS.
 */
export async function buildUserPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferences> {
  // Applied and rejected matches, joined back to offer metadata.
  const { data: matchRows } = await supabase
    .from('matches')
    .select(
      `status, created_at, offers!inner(title, topic, tags, user_id)`,
    )
    .eq('offers.user_id', userId)
    .in('status', ['applied', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(RECENT_LIMIT);

  const applied: UserPreferences['appliedOffers'] = [];
  const rejected: UserPreferences['rejectedOffers'] = [];
  for (const row of matchRows ?? []) {
    const offer = Array.isArray(row.offers) ? row.offers[0] : (row.offers as any);
    if (!offer) continue;
    const entry = {
      title: offer.title as string,
      topic: (offer.topic as string) ?? '',
      tags: ((offer.tags as string[]) ?? []) as string[],
    };
    if (row.status === 'applied') applied.push(entry);
    else if (row.status === 'rejected') rejected.push(entry);
  }

  const { data: dismissalRows } = await supabase
    .from('issue_dismissals')
    .select('pattern_host, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(RECENT_LIMIT);

  const toleratedHosts = Array.from(
    new Set(
      (dismissalRows ?? [])
        .map((d) => d.pattern_host)
        .filter((h): h is string => Boolean(h)),
    ),
  ).slice(0, HOST_CAP);

  const reasonNotes = Array.from(
    new Set(
      (dismissalRows ?? [])
        .map((d) => d.reason)
        .filter((r): r is string => Boolean(r && r.trim())),
    ),
  ).slice(0, REASON_CAP);

  return {
    appliedOffers: applied,
    rejectedOffers: rejected,
    toleratedHosts,
    reasonNotes,
  };
}
