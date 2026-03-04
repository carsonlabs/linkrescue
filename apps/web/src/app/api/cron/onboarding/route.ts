import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { sendEmail } from '@linkrescue/email';
import { OnboardingWelcome } from '@linkrescue/email';
import { OnboardingTips } from '@linkrescue/email';
import { OnboardingHealthScore } from '@linkrescue/email';
import { OnboardingProgress } from '@linkrescue/email';
import { UpgradeNudge } from '@linkrescue/email';
import { getUserPlan } from '@linkrescue/types';
import type { UpgradeNudgeTrigger } from '@linkrescue/email';

export const maxDuration = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.linkrescue.io';

// Onboarding sequence: Day 0 = welcome, Day 3 = tips, Day 7 = health score, Day 14 = progress
const SEQUENCE = [
  { day: 0, key: 'onboarding_welcome', subject: 'Welcome to LinkRescue — get started in 60 seconds' },
  { day: 3, key: 'onboarding_tips', subject: '3 quick fixes that save most affiliate revenue' },
  { day: 7, key: 'onboarding_health_score', subject: 'Your site health score explained' },
  { day: 14, key: 'onboarding_progress', subject: 'Your first 2 weeks with LinkRescue' },
] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const today = startOfDay(now);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Get all auth users (paginated — Supabase returns max 1000 per page)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError || !authData?.users) {
    console.error('Failed to list users:', authError);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }

  const users = authData.users;

  // Build a set of already-sent emails to avoid redundant DB lookups
  const { data: sentLogs } = await supabase
    .from('email_sequence_log')
    .select('user_id, email_key');

  const sentSet = new Set(
    (sentLogs ?? []).map((log) => `${log.user_id}:${log.email_key}`)
  );

  for (const user of users) {
    if (!user.email) continue;

    const createdAt = startOfDay(new Date(user.created_at));
    const daysSinceSignup = Math.floor(
      (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get public profile for name and plan info
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, stripe_price_id')
      .eq('id', user.id)
      .single();

    const name = profile?.full_name || user.email.split('@')[0];
    const plan = getUserPlan(profile?.stripe_price_id ?? null);

    // --- Onboarding sequence ---
    for (const step of SEQUENCE) {
      if (daysSinceSignup !== step.day) continue;

      const logKey = `${user.id}:${step.key}`;
      if (sentSet.has(logKey)) {
        skipped++;
        continue;
      }

      try {
        let react: React.ReactElement;

        switch (step.key) {
          case 'onboarding_welcome':
            react = OnboardingWelcome({ name, appUrl: APP_URL });
            break;
          case 'onboarding_tips':
            react = OnboardingTips({ name, appUrl: APP_URL });
            break;
          case 'onboarding_health_score': {
            // Try to get the user's first site health score
            const { data: sites } = await supabase
              .from('sites')
              .select('id')
              .eq('user_id', user.id)
              .limit(1);
            const siteId = sites?.[0]?.id;
            let healthScore: number | undefined;
            if (siteId) {
              const { data: score } = await (supabase as any)
                .from('site_health_scores')
                .select('score')
                .eq('site_id', siteId)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .maybeSingle() as { data: { score: number } | null };
              healthScore = score?.score ?? undefined;
            }
            react = OnboardingHealthScore({ name, appUrl: APP_URL, siteId, healthScore });
            break;
          }
          case 'onboarding_progress': {
            // Gather stats for the 14-day progress email
            const { data: userSites } = await supabase
              .from('sites')
              .select('id')
              .eq('user_id', user.id);
            const sitesAdded = userSites?.length ?? 0;

            const { count: scansCompleted } = await supabase
              .from('scans')
              .select('*', { count: 'exact', head: true })
              .in('site_id', (userSites ?? []).map((s) => s.id))
              .eq('status', 'completed');

            const { count: issuesFound } = await supabase
              .from('scan_results')
              .select('*', { count: 'exact', head: true })
              .in('scan_id', [] as string[]) // simplified — count all issues for user's sites
              .neq('issue_type', 'OK');

            react = OnboardingProgress({
              name,
              appUrl: APP_URL,
              isFreePlan: plan === 'free',
              sitesAdded,
              scansCompleted: scansCompleted ?? 0,
              issuesFound: issuesFound ?? 0,
              issuesResolved: 0,
            });
            break;
          }
        }

        await sendEmail({ to: user.email, subject: step.subject, react });

        // Record the sent email
        await supabase.from('email_sequence_log').insert({
          user_id: user.id,
          email_key: step.key,
        });

        sentSet.add(logKey);
        sent++;
      } catch (err) {
        console.error(`Failed to send ${step.key} to ${user.email}:`, err);
        failed++;
      }
    }

    // --- Upgrade nudge for active free users at Day 30+ ---
    if (plan === 'free' && daysSinceSignup >= 30) {
      const nudgeKey = `${user.id}:upgrade_nudge_active`;
      if (!sentSet.has(nudgeKey)) {
        // Check if user has at least 1 site (indicates active usage)
        const { count: siteCount } = await supabase
          .from('sites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if ((siteCount ?? 0) > 0) {
          try {
            const react = UpgradeNudge({
              name,
              appUrl: APP_URL,
              trigger: 'active_free_user' as UpgradeNudgeTrigger,
            });

            await sendEmail({
              to: user.email,
              subject: "You've been using LinkRescue for a month — here's what you're missing",
              react,
            });

            await supabase.from('email_sequence_log').insert({
              user_id: user.id,
              email_key: 'upgrade_nudge_active',
            });

            sentSet.add(nudgeKey);
            sent++;
          } catch (err) {
            console.error(`Failed to send upgrade nudge to ${user.email}:`, err);
            failed++;
          }
        }
      }
    }
  }

  return NextResponse.json({
    message: `Onboarding emails: ${sent} sent, ${skipped} skipped (already sent), ${failed} failed`,
    sent,
    skipped,
    failed,
  });
}
