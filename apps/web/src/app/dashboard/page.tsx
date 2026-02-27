import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLatestScan, getIssueCountsForSite } from '@linkrescue/database';
import { getUserPlan } from '@linkrescue/types';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Plus,
  ArrowRight,
  TrendingDown,
  Zap,
  Crown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id, created_at')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null);

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const siteData = await Promise.all(
    (sites ?? []).map(async (site) => {
      const { data: latestScan } = await getLatestScan(supabase, site.id);
      const issueCounts = await getIssueCountsForSite(supabase, site.id);
      return { site, latestScan, issueCounts };
    }),
  );

  const totalIssues = siteData.reduce((sum, { issueCounts }) => sum + issueCounts.total, 0);
  const totalLinks = siteData.reduce(
    (sum, { latestScan }) => sum + (latestScan?.links_checked ?? 0),
    0,
  );
  const sitesWithIssues = siteData.filter(({ issueCounts }) => issueCounts.total > 0);
  const healthySites = siteData.filter(({ issueCounts }) => issueCounts.total === 0);
  const verifiedSites = siteData.filter(({ site }) => site.verified_at);

  // Last scan across all sites
  const lastScanDate = siteData
    .flatMap(({ latestScan }) => (latestScan?.finished_at ? [latestScan.finished_at] : []))
    .sort()
    .at(-1);

  const firstName = user.email?.split('@')[0] ?? 'there';

  if ((sites ?? []).length === 0) {
    return <EmptyState plan={plan} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">
          Hey {firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm">
          {lastScanDate
            ? `Last scan: ${new Date(lastScanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            : 'No scans yet — verify a site to get started.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sites monitored"
          value={String(verifiedSites.length)}
          sub={`${sites?.length ?? 0} total`}
          color="green"
        />
        <StatCard
          label="Active issues"
          value={String(totalIssues)}
          sub={`${sitesWithIssues.length} sites affected`}
          color={totalIssues > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Links checked"
          value={totalLinks >= 1000 ? `${(totalLinks / 1000).toFixed(1)}K` : String(totalLinks)}
          sub="latest scans"
          color="purple"
        />
        <StatCard
          label="Healthy sites"
          value={String(healthySites.length)}
          sub={`of ${sites?.length ?? 0} sites`}
          color="green"
        />
      </div>

      {/* Sites with issues */}
      {sitesWithIssues.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Sites needing attention
            </h2>
            <Link
              href="/dashboard/sites"
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {sitesWithIssues.slice(0, 5).map(({ site, issueCounts, latestScan }) => (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.id}`}
                className="glass-card p-4 flex items-center justify-between hover:border-red-500/20 transition-all group"
              >
                <div>
                  <p className="font-medium text-sm group-hover:text-white transition-colors">
                    {site.domain}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {latestScan
                      ? `Scanned ${new Date(latestScan.finished_at ?? latestScan.created_at).toLocaleDateString()}`
                      : 'Not yet scanned'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-400">{issueCounts.total}</span>
                    <p className="text-xs text-slate-500">issues</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Healthy sites */}
      {healthySites.length > 0 && sitesWithIssues.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            All clear
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {healthySites.map(({ site, latestScan }) => (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.id}`}
                className="glass-card p-4 flex items-center gap-4 hover:border-green-500/20 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-white transition-colors">
                    {site.domain}
                  </p>
                  <p className="text-xs text-slate-500">
                    {latestScan
                      ? `${latestScan.links_checked ?? 0} links — all OK`
                      : 'Pending first scan'}
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-display font-semibold text-lg mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/dashboard/sites/new" className="feature-card group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <Plus className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Add a site</p>
              <p className="text-xs text-slate-500">Monitor a new domain</p>
            </div>
          </Link>
          <Link href="/dashboard/analytics" className="feature-card group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Revenue analytics</p>
              <p className="text-xs text-slate-500">Track recovered revenue</p>
            </div>
          </Link>
          <Link href="/dashboard/offers" className="feature-card group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Manage offers</p>
              <p className="text-xs text-slate-500">AI-powered link matching</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upgrade CTA */}
      {plan === 'free' && (
        <div className="gradient-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5">You&apos;re on the Free plan</p>
              <p className="text-xs text-slate-400">
                Upgrade to Pro for 5 sites, 500 pages/scan, AI offer matching, and guardian links.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary whitespace-nowrap text-sm flex-shrink-0">
            Upgrade to Pro
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: 'green' | 'red' | 'purple';
}) {
  const valueClass =
    color === 'red'
      ? 'text-red-400'
      : color === 'purple'
        ? 'text-gradient-purple'
        : 'text-gradient';

  return (
    <div className="glass-card p-5">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

function EmptyState({ plan }: { plan: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">Welcome to LinkRescue</h1>
        <p className="text-slate-400 text-sm">Add your first site to start monitoring.</p>
      </div>

      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <Globe className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-display font-semibold text-xl mb-3">No sites yet</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          Add a site and verify ownership with a single meta tag. LinkRescue will scan it nightly
          and alert you to any broken affiliate links.
        </p>
        <Link href="/dashboard/sites/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add your first site
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {plan === 'free' && (
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          {['1 site', '50 pages/scan', 'Weekly email digests'].map((f) => (
            <div key={f} className="glass-card p-4">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">{f}</p>
              <p className="text-xs text-slate-500">Included free</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
