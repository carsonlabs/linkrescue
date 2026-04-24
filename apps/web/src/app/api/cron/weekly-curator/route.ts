import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { hasFeature, getUserPlan } from '@linkrescue/types';
import { runCuratorForUser } from '@/lib/curator/runner';

export const maxDuration = 300;

// How many users we attempt inline per cron tick before deferring the rest
// to the next run. Sequential runs are ~30-90s each; 5 stays under the
// 300s maxDuration with headroom. Bump once we move to a real queue.
const MAX_USERS_PER_TICK = 5;

/**
 * Weekly Curator cron. Identifies users due for a run (Pro+, verified site,
 * curator_last_run_at > 6 days) and invokes the curator runner sequentially
 * up to MAX_USERS_PER_TICK. Users beyond the cap are deferred to next tick
 * (they'll still appear as "due" until successfully run).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: sites, error: sitesErr } = await supabase
    .from('sites')
    .select('user_id')
    .not('verified_at', 'is', null);

  if (sitesErr) {
    return NextResponse.json({ error: sitesErr.message }, { status: 500 });
  }

  const verifiedUserIds = Array.from(new Set((sites ?? []).map((s: any) => s.user_id)));
  if (verifiedUserIds.length === 0) {
    return NextResponse.json({ due: [], skipped: 0 });
  }

  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

  type Row = { id: string; stripe_price_id: string | null; curator_last_run_at: string | null };

  const { data: usersData, error: usersErr } = await supabase
    .from('users')
    // curator_last_run_at is added by migrations/memory_phase3_curator.sql —
    // generated types lag until `supabase gen types` is re-run, so read as any.
    .select('id, stripe_price_id, curator_last_run_at' as any)
    .in('id', verifiedUserIds);

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  const users = (usersData ?? []) as unknown as Row[];
  const due: Array<{ user_id: string; plan: string }> = [];
  let skipped = 0;

  for (const u of users) {
    const plan = getUserPlan(u.stripe_price_id ?? null);
    // Gate: the curator is a Pro+ feature (reuses the existing fix_suggestions
    // feature flag rather than inventing a new one — both are AI-driven).
    if (!hasFeature(plan, 'fix_suggestions')) {
      skipped++;
      continue;
    }
    if (u.curator_last_run_at && u.curator_last_run_at > sixDaysAgo) {
      skipped++;
      continue;
    }
    due.push({ user_id: u.id, plan });
  }

  const toRun = due.slice(0, MAX_USERS_PER_TICK);
  const deferred = due.slice(MAX_USERS_PER_TICK);

  const runs: Array<{
    userId: string;
    insightsPublished: number;
    toolCalls: number;
    error?: string;
  }> = [];

  for (const entry of toRun) {
    const r = await runCuratorForUser(entry.user_id);
    runs.push({
      userId: r.userId,
      insightsPublished: r.insightsPublished,
      toolCalls: r.toolCalls,
      error: r.error,
    });
  }

  return NextResponse.json({
    ran: runs.length,
    deferred: deferred.length,
    skipped,
    runs,
    generated_at: new Date().toISOString(),
  });
}
