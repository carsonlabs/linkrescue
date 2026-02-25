import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getLatestScan, getIssueCountsForSite } from '@linkrescue/database';
import { SiteCard } from '@/components/dashboard/site-card';
import { Globe, Plus } from 'lucide-react';
import { Button, Card } from '@/components/ui';

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
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Your Sites</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {siteData.length === 0
              ? 'Add your first site to start monitoring.'
              : `Monitoring ${siteData.length} site${siteData.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="md" asChild>
          <Link href="/sites/new">
            <Plus className="w-4 h-4" />
            Add Site
          </Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {siteData.map(({ site, latestScan, issueCounts }) => (
          <SiteCard
            key={site.id}
            site={site}
            latestScan={latestScan}
            issueCount={issueCounts.total}
          />
        ))}

        {sites?.length === 0 && (
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-lg mb-2">No sites yet</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Add your first site to start monitoring affiliate links. Verification takes less than a
              minute.
            </p>
            <Button size="lg" asChild>
              <Link href="/sites/new">
                <Plus className="w-4 h-4" />
                Add your first site
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
