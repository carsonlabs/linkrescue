import Link from 'next/link';
import type { Database } from '@linkrescue/database';

type Site = Database['public']['Tables']['sites']['Row'];
type Scan = Database['public']['Tables']['scans']['Row'];

export function SiteCard({
  site,
  latestScan,
  issueCount,
}: {
  site: Site;
  latestScan: Scan | null;
  issueCount: number;
}) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="border rounded-lg p-4 hover:bg-accent transition-colors block"
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-lg">{site.domain}</h2>
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
          </div>
        </div>
        <div className="text-right">
          {issueCount > 0 && (
            <span className="text-lg font-bold text-destructive">{issueCount}</span>
          )}
          {issueCount > 0 && (
            <p className="text-xs text-muted-foreground">issues found</p>
          )}
          {issueCount === 0 && latestScan && (
            <span className="text-sm text-green-600">No issues</span>
          )}
        </div>
      </div>
      {latestScan && (
        <p className="text-xs text-muted-foreground mt-2">
          Last scan: {new Date(latestScan.finished_at || latestScan.created_at).toLocaleDateString()}{' '}
          &middot; {latestScan.pages_scanned} pages &middot; {latestScan.links_checked} links
        </p>
      )}
      {!latestScan && site.verified_at && (
        <p className="text-xs text-muted-foreground mt-2">No scans yet</p>
      )}
    </Link>
  );
}
