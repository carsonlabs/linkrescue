import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLatestScan } from '@linkrescue/database';
import { IssuesTable } from '@/components/dashboard/issues-table';
import { VerifyButton, ScanButton } from '@/components/dashboard/scan-status';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Copy } from 'lucide-react';

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

  const verifyMetaTag = `<meta name="linkrescue-site-verification" content="${site.verify_token}" />`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sites"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sites
        </Link>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{site.domain}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {site.verified_at ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Not verified
                </span>
              )}
              {latestScan && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last scan:{' '}
                  {new Date(latestScan.finished_at || latestScan.created_at).toLocaleDateString()}{' '}
                  &middot; {latestScan.pages_scanned} pages &middot; {latestScan.links_checked} links
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!site.verified_at && <VerifyButton siteId={site.id} />}
            {site.verified_at && <ScanButton siteId={site.id} />}
          </div>
        </div>
      </div>

      {!site.verified_at && (
        <div className="border rounded-xl p-6 bg-amber-50 border-amber-200">
          <h3 className="font-semibold mb-1 text-amber-900">Verify your site ownership</h3>
          <p className="text-sm text-amber-800 mb-4">
            Add the following meta tag to your homepage&apos;s{' '}
            <code className="bg-amber-100 px-1 rounded text-xs">&lt;head&gt;</code> section, then
            click &quot;Verify Ownership&quot; above.
          </p>
          <div className="relative">
            <code className="block bg-white border border-amber-200 p-3 rounded-lg text-xs break-all font-mono text-amber-900">
              {verifyMetaTag}
            </code>
          </div>
        </div>
      )}

      {site.verified_at && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Issues
              {issues.length > 0 && (
                <span className="ml-2 text-sm font-normal bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {issues.length}
                </span>
              )}
            </h2>
          </div>
          {issues.length === 0 && latestScan && (
            <div className="border rounded-xl p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No issues found</h3>
              <p className="text-sm text-muted-foreground">
                All {latestScan.links_checked} links checked successfully.
              </p>
            </div>
          )}
          {issues.length === 0 && !latestScan && (
            <div className="border rounded-xl p-10 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">First scan pending</h3>
              <p className="text-sm text-muted-foreground">
                Your site is verified. The first scan will run tonight, or you can trigger one
                manually above.
              </p>
            </div>
          )}
          {issues.length > 0 && <IssuesTable issues={issues} siteId={site.id} />}
        </div>
      )}
    </div>
  );
}
