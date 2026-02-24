import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRevenueTotals } from '@linkrescue/database';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [totals, { count: brokenLinks }, { count: activeGuardian }, { count: deployedRules }] =
    await Promise.all([
      getRevenueTotals(supabase, user.id),
      supabase
        .from('scan_results')
        .select('*', { count: 'exact', head: true })
        .not('issue_type', 'eq', 'OK')
        .in('scan_id', supabase.from('scans').select('id').in('site_id', supabase.from('sites').select('id').eq('user_id', user.id))),
      supabase
        .from('guardian_links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('redirect_rules')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'deployed'),
    ]);

  const recoveryRatePct =
    totals.lostCents > 0
      ? Math.round((totals.recoveredCents / totals.lostCents) * 100)
      : 0;

  return NextResponse.json({
    revenueAtRiskCents: totals.lostCents,
    revenueRecoveredCents: totals.recoveredCents,
    recoveryRatePct,
    totalBrokenLinks: brokenLinks ?? 0,
    activeGuardianLinks: activeGuardian ?? 0,
    deployedRedirectRules: deployedRules ?? 0,
  });
}
