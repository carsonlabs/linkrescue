import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getLatestScan } from '@linkrescue/database';
import { IssuesTable } from '@/components/dashboard/issues-table';
import { VerifyButton, ScanButton } from '@/components/dashboard/scan-status';

export default async function SiteDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!site) notFound();

  const { data: latestScan } = await getLatestScan(supabase, site.id);

  // Fetch issues from the latest scan
  let issues: any[] = [];
  if (latestScan) {
    const { data } = await supabase
      .from('scan_results')
      .select(`
        id,
        issue_type,
        status_code,
        final_url,
        redirect_hops,
        checked_at,
        link:links!inner(id, href, is_affiliate, page:pages!inner(url))
      `)
      .eq('scan_id', latestScan.id)
      .neq('issue_type', 'OK')
      .order('checked_at', { ascending: false })
      .limit(200);

    issues = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{site.domain}</h1>
          <div className="flex gap-2 mt-1">
            {site.verified_at ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Verified
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Not verified
              </span>
            )}
            {latestScan && (
              <span className="text-xs text-muted-foreground">
                Last scan:{' '}
                {new Date(latestScan.finished_at || latestScan.created_at).toLocaleDateString()} &middot;{' '}
                {latestScan.pages_scanned} pages &middot; {latestScan.links_checked} links
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!site.verified_at && <VerifyButton siteId={site.id} />}
          {site.verified_at && <ScanButton siteId={site.id} />}
        </div>
      </div>

      {!site.verified_at && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h3 className="font-medium mb-2">Verify your site ownership</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Add the following meta tag to your homepage&apos;s {'<head>'} section:
          </p>
          <code className="block bg-background p-3 rounded text-xs break-all">
            {'<meta name="linkrescue-site-verification" content="'}
            {site.verify_token}
            {'" />'}
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Then click &quot;Verify Ownership&quot; above.
          </p>
        </div>
      )}

      {site.verified_at && (
        <>
          <h2 className="text-lg font-semibold">
            Issues {issues.length > 0 && `(${issues.length})`}
          </h2>
          <IssuesTable issues={issues} siteId={site.id} />
        </>
      )}
    </div>
  );
}
