import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getLatestScan, getIssueCountsForSite } from '@linkrescue/database';
import { getUserPlan, hasFeature, type TierName } from '@linkrescue/types';
import { SiteCard } from '@/components/dashboard/site-card';
import { Globe, Plus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SitesListPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user plan for on-demand scan access
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null) as TierName;
  const canScan = hasFeature(plan, 'on_demand_scans');

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch latest scan and issue counts for each site
  const siteData = await Promise.all(
    (sites ?? []).map(async (site) => {
      const { data: latestScan } = await getLatestScan(supabase, site.id);
      const issueCounts = await getIssueCountsForSite(supabase, site.id);
      return { site, latestScan, issueCounts };
    }),
  );

  const totalIssues = siteData.reduce((sum, { issueCounts }) => sum + issueCounts.total, 0);
  const totalScanned = siteData.reduce((sum, { latestScan }) => sum + (latestScan?.links_checked || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Your Sites</h1>
          <p className="text-slate-400 text-sm">
            {siteData.length === 0
              ? 'Add your first site to start monitoring.'
              : `Monitoring ${siteData.length} site${siteData.length !== 1 ? 's' : ''} · ${totalIssues} issues · ${totalScanned.toLocaleString()} links checked`}
          </p>
        </div>
        <Link href="/sites/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Site
        </Link>
      </div>

      {/* Sites Grid */}
      <div className="grid gap-4">
        {siteData.map(({ site, latestScan, issueCounts }) => (
          <SiteCard
            key={site.id}
            site={site}
            latestScan={latestScan}
            issueCount={issueCounts.total}
            canScan={canScan}
          />
        ))}

        {sites?.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="font-display font-semibold text-xl mb-3">No sites yet</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
              Add your first site to start monitoring affiliate links. Verification takes less than a minute.
            </p>
            <Link href="/sites/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Add your first site
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {sites && sites.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="glass-card p-4 text-center">
            <div className="font-display text-2xl font-bold text-gradient">{sites.length}</div>
            <div className="text-xs text-slate-500 mt-1">Sites</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="font-display text-2xl font-bold text-gradient-purple">{totalIssues}</div>
            <div className="text-xs text-slate-500 mt-1">Issues</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="font-display text-2xl font-bold text-gradient">{totalScanned.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Links</div>
          </div>
        </div>
      )}
    </div>
  );
}
