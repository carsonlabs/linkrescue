import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits, hasFeature } from '@linkrescue/types';
import { analyzeDeadLink, matchOffers } from '@linkrescue/ai';
import type { OfferInput } from '@linkrescue/ai';
import { buildUserPreferences } from '@/lib/user-preferences';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('stripe_price_id').eq('id', user.id).single();
  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  if (limits.aiMatchesPerScan === 0) {
    return NextResponse.json({ error: 'AI matching requires a paid plan. Upgrade to Pro or Agency.' }, { status: 403 });
  }

  // Verify user owns the scan's site
  const { data: scan } = await supabase
    .from('scans')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', params.id)
    .single();

  if (!scan || (scan.sites as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch unmatched broken results
  const { data: brokenResults } = await supabase
    .from('scan_results')
    .select('id, link_id, links!inner(href)')
    .eq('scan_id', params.id)
    .not('issue_type', 'eq', 'OK')
    .not('id', 'in', `(SELECT DISTINCT scan_result_id FROM matches)`)
    .limit(limits.aiMatchesPerScan);

  if (!brokenResults || brokenResults.length === 0) {
    return NextResponse.json({ analyzed: 0, matchesCreated: 0 });
  }

  // Fetch user's offers
  const { data: offerRows } = await supabase
    .from('offers')
    .select('id, title, url, topic, tags')
    .eq('user_id', user.id);

  const offers: OfferInput[] = (offerRows ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    url: o.url,
    topic: o.topic,
    tags: o.tags,
  }));

  // Per-user preference memory: applied/rejected offer history + dismissal
  // patterns. Built once per request and reused across every matchOffers call
  // in the loop below — prompt caching in matchOffers reuses the cached
  // system block on calls 2..N.
  const preferences = await buildUserPreferences(supabase, user.id);

  let matchesCreated = 0;

  for (const result of brokenResults) {
    const link = result.links as unknown as { href: string };
    try {
      const analysis = await analyzeDeadLink(link.href);
      const matches = await matchOffers(analysis, offers, preferences);
      const top3 = matches.slice(0, 3);

      for (const match of top3) {
        await supabase.from('matches').insert({
          scan_result_id: result.id,
          offer_id: match.offer_id,
          match_score: match.score,
          match_reason: match.reason,
          status: 'pending',
        });
        matchesCreated++;
      }
    } catch (err) {
      console.error(`[analyze] AI analysis failed for ${link.href}:`, err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ analyzed: brokenResults.length, matchesCreated });
}
