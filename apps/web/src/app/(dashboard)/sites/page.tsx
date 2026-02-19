import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getLatestScan, getIssueCountsForSite } from '@linkrescue/database';
import { SiteCard } from '@/components/dashboard/site-card';

export default async function SitesListPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

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
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Your Sites</h1>
        <Link
          href="/sites/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90"
        >
          Add Site
        </Link>
      </div>
      <div className="grid gap-4">
        {siteData.map(({ site, latestScan, issueCounts }) => (
          <SiteCard
            key={site.id}
            site={site}
            latestScan={latestScan}
            issueCount={issueCounts.total}
          />
        ))}
        {sites?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No sites yet. Add your first site to get started!
            </p>
            <Link
              href="/sites/new"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90"
            >
              Add Site
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
