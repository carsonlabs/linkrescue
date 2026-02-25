import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import type { Database } from '@linkrescue/database';
import { Badge } from '@/components/ui';

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
  const lastScanDate = latestScan
    ? new Date(latestScan.finished_at || latestScan.created_at)
    : null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Less than an hour ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <Link
      href={`/sites/${site.id}`}
      className="border bg-card rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all block group"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-base truncate">{site.domain}</h2>
            {site.verified_at ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <AlertCircle className="w-3 h-3" />
                Not verified
              </Badge>
            )}
          </div>

          {lastScanDate && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              Last scan {formatDate(lastScanDate)} &middot; {latestScan?.pages_scanned ?? 0} pages
              &middot; {latestScan?.links_checked ?? 0} links
            </p>
          )}
          {!latestScan && site.verified_at && (
            <p className="text-xs text-muted-foreground mt-1.5">No scans yet — first scan pending</p>
          )}
          {!site.verified_at && (
            <p className="text-xs text-amber-600 mt-1.5">
              Add verification meta tag to start scanning
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          {issueCount > 0 ? (
            <>
              <span className="text-xl font-bold text-destructive leading-none">{issueCount}</span>
              <p className="text-xs text-muted-foreground">
                issue{issueCount !== 1 ? 's' : ''} found
              </p>
            </>
          ) : latestScan ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              All good
            </span>
          ) : null}
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 mt-1 group-hover:text-primary/50 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
