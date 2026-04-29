import { NextResponse } from 'next/server';
import { createAdminClient, getUserScoreboard } from '@linkrescue/database';
import { getUserPlan } from '@linkrescue/types';
import { sendWeeklyScoreboard } from '@linkrescue/email';

export const maxDuration = 300;

/**
 * Weekly scoreboard digest. Triggered Sundays at 9am UTC by Vercel Cron.
 * Sends the dollar-led recap email to every verified user.
 *
 * Idempotent-ish: we don't double-send within a 6-day window using
 * email_sequence_log keyed by ISO week.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.linkrescue.io';

  // ISO week key — used to dedupe sends within the same week
  const now = new Date();
  const weekKey = `scoreboard_${isoWeekKey(now)}`;

  // Pull all users who own at least one verified site
  const { data: users, error } = await supabase
    .from('users')
    .select('id, stripe_price_id')
    .returns<Array<{ id: string; stripe_price_id: string | null }>>();

  if (error || !users) {
    console.error('[weekly-scoreboard] Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Has a verified site?
      const { data: hasSite } = await supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('verified_at', 'is', null);
      if (hasSite === null) {
        skipped++;
        continue;
      }

      // Already sent this week?
      const { data: alreadySent } = await supabase
        .from('email_sequence_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_key', weekKey)
        .maybeSingle();
      if (alreadySent) {
        skipped++;
        continue;
      }

      // Auth user → email
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      const email = authUser?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      const plan = getUserPlan(user.stripe_price_id);
      const scoreboard = await getUserScoreboard(supabase, user.id);

      // No data yet — skip until they actually have a scan run
      if (!scoreboard || scoreboard.issues_caught_this_month === 0) {
        skipped++;
        continue;
      }

      // Recent wins (last 7d, top 3 by value)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const wins = await fetchRecentWins(supabase, user.id, weekAgo);

      // Top risks (currently unresolved, top 3 by value)
      const risks = await fetchTopRisks(supabase, user.id);

      // Curator's most recent summary or recommendation
      const { data: curatorRows } = (await supabase
        .from('curator_insights')
        .select('headline, body, kind, created_at')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .in('kind', ['summary', 'recommendation'])
        .order('created_at', { ascending: false })
        .limit(1)) as {
        data: Array<{ headline: string; body: string | null; kind: string; created_at: string }> | null;
      };
      const curator = curatorRows?.[0] ?? null;
      const curatorNote = curator
        ? curator.body
          ? `${curator.headline} ${curator.body}`
          : curator.headline
        : null;

      const firstName = email.split('@')[0] ?? 'there';

      await sendWeeklyScoreboard(email, {
        appUrl,
        firstName,
        revenueProtectedCents: scoreboard.revenue_protected_cents,
        revenueProtectedLastMonthCents: scoreboard.revenue_protected_last_month_cents,
        revenueAtRiskCents: scoreboard.revenue_at_risk_cents,
        issuesCaughtThisMonth: scoreboard.issues_caught_this_month,
        issuesResolvedThisMonth: scoreboard.issues_resolved_this_month,
        avgHealthScore7d: scoreboard.avg_health_score_7d,
        topAtRiskProgram: scoreboard.top_at_risk_program,
        topProgramIssueCount: scoreboard.top_program_issue_count,
        recentWins: wins,
        topRisks: risks,
        curatorNote,
        isFreePlan: plan === 'free',
      });

      // Log so we don't double-send
      await supabase
        .from('email_sequence_log')
        .insert({ user_id: user.id, email_key: weekKey });

      sent++;
    } catch (err) {
      console.error(`[weekly-scoreboard] User ${user.id} failed:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  return NextResponse.json({ sent, skipped, failed, weekKey });
}

interface ScanResultJoined {
  final_url: string | null;
  estimated_value_cents: number;
  issue_type: string;
  links: { href: string; is_affiliate: boolean | null }[] | null;
  scans: { sites: { user_id: string; domain: string }[] | null }[] | null;
}

async function fetchRecentWins(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  sinceIso: string
): Promise<Array<{ pageUrl: string; network: string | null; valueCents: number }>> {
  const { data } = (await supabase
    .from('scan_results')
    .select(
      'final_url, estimated_value_cents, issue_type, links!inner(href, is_affiliate), scans!inner(sites!inner(user_id, domain))'
    )
    .eq('scans.sites.user_id', userId)
    .gte('resolved_at', sinceIso)
    .order('estimated_value_cents', { ascending: false })
    .limit(3)) as { data: ScanResultJoined[] | null };

  return (data ?? []).map((r) => ({
    pageUrl: r.final_url ?? r.links?.[0]?.href ?? '(unknown)',
    network: extractNetwork(r.links?.[0]?.href ?? ''),
    valueCents: r.estimated_value_cents ?? 0,
  }));
}

async function fetchTopRisks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<Array<{ pageUrl: string; network: string | null; issueType: string; valueCents: number }>> {
  const { data } = (await supabase
    .from('scan_results')
    .select(
      'final_url, estimated_value_cents, issue_type, links!inner(href, is_affiliate), scans!inner(sites!inner(user_id, domain))'
    )
    .eq('scans.sites.user_id', userId)
    .neq('issue_type', 'OK')
    .is('resolved_at', null)
    .order('estimated_value_cents', { ascending: false })
    .limit(3)) as { data: ScanResultJoined[] | null };

  return (data ?? []).map((r) => ({
    pageUrl: r.final_url ?? r.links?.[0]?.href ?? '(unknown)',
    network: extractNetwork(r.links?.[0]?.href ?? ''),
    issueType: r.issue_type,
    valueCents: r.estimated_value_cents ?? 0,
  }));
}

const NETWORK_PATTERNS: Array<[string, string]> = [
  ['amzn.to', 'Amazon'],
  ['amazon.com', 'Amazon'],
  ['shareasale.com', 'ShareASale'],
  ['anrdoezrs.net', 'CJ Affiliate'],
  ['dpbolvw.net', 'CJ Affiliate'],
  ['jdoqocy.com', 'CJ Affiliate'],
  ['kqzyfj.com', 'CJ Affiliate'],
  ['tkqlhce.com', 'CJ Affiliate'],
  ['sjv.io', 'Impact'],
  ['pntra.com', 'Impact'],
  ['linksynergy.com', 'Rakuten'],
  ['hop.clickbank.net', 'ClickBank'],
  ['awin1.com', 'Awin'],
  ['flexlinkspro.com', 'FlexOffers'],
  ['prf.hn', 'Partnerize'],
  ['rover.ebay.com', 'eBay'],
  ['goto.walmart.com', 'Walmart'],
  ['goto.target.com', 'Target'],
  ['shopify.pxf.io', 'Shopify'],
  ['bluehost.com', 'Bluehost'],
  ['siteground.com', 'SiteGround'],
  ['hostinger.com', 'Hostinger'],
  ['nordvpn.net', 'NordVPN'],
  ['expressvpn.com', 'ExpressVPN'],
  ['semrush.com', 'Semrush'],
  ['ahrefs.com', 'Ahrefs'],
];

function extractNetwork(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  for (const [pattern, name] of NETWORK_PATTERNS) {
    if (lower.includes(pattern)) return name;
  }
  return null;
}

/** YYYY-Www ISO week key, e.g. 2026-W17 */
function isoWeekKey(d: Date): string {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
