import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRevenueHistory, getRevenueTotals, getFinancialSummary } from '@linkrescue/database';
import RevenueChart from './RevenueChart';

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: history }, totals, summary] = await Promise.all([
    getRevenueHistory(supabase, user.id, 90),
    getRevenueTotals(supabase, user.id),
    getFinancialSummary(supabase, user.id),
  ]);

  const { count: brokenCount } = await supabase
    .from('scan_results')
    .select('*', { count: 'exact', head: true })
    .not('issue_type', 'eq', 'OK');

  const recoveryRatePct =
    totals.lostCents > 0
      ? Math.round((totals.recoveredCents / totals.lostCents) * 100)
      : 0;

  const chartData = (history ?? []).map((row) => ({
    date: row.date,
    lost: row.total_revenue_lost_cents / 100,
    recovered: row.total_revenue_recovered_cents / 100,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <p className="text-muted-foreground mt-1">Track revenue at risk and recovery performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg bg-background p-5">
          <p className="text-sm text-muted-foreground mb-1">Revenue At Risk</p>
          <p className="text-2xl font-bold text-red-600">
            ${(totals.lostCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{brokenCount ?? 0} broken links detected</p>
        </div>
        <div className="border rounded-lg bg-background p-5">
          <p className="text-sm text-muted-foreground mb-1">Revenue Recovered</p>
          <p className="text-2xl font-bold text-green-600">
            ${(totals.recoveredCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{summary.totalRescues} rescues</p>
        </div>
        <div className="border rounded-lg bg-background p-5">
          <p className="text-sm text-muted-foreground mb-1">Recovery Rate</p>
          <p className="text-2xl font-bold">{recoveryRatePct}%</p>
          <p className="text-xs text-muted-foreground mt-1">of at-risk revenue saved</p>
        </div>
      </div>

      {/* Chart */}
      <div className="border rounded-lg bg-background p-6 mb-8">
        <h2 className="text-base font-semibold mb-4">90-Day Revenue Trend</h2>
        <RevenueChart data={chartData} />
      </div>

      {/* Top guardian links */}
      {summary.byLink.length > 0 && (
        <div className="border rounded-lg bg-background overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-base font-semibold">Top Guardian Links by Value Saved</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Rescues</th>
                <th className="px-4 py-2 text-left font-medium">Value Saved</th>
              </tr>
            </thead>
            <tbody>
              {summary.byLink
                .sort((a, b) => b.valueCents - a.valueCents)
                .slice(0, 10)
                .map((link) => (
                  <tr key={link.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{link.slug}</td>
                    <td className="px-4 py-3">{link.rescues}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      ${(link.valueCents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
