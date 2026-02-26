import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Globe } from 'lucide-react';
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
  const lastScanDate = latestScan
    ? new Date(latestScan.finished_at || latestScan.created_at)
    : null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <Link
      href={`/sites/${site.id}`}
      className="group relative glass-card p-6 hover:border-green-500/30 transition-all block"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-slate-300" />
            </div>
            <h2 className="font-display font-semibold text-lg truncate">{site.domain}</h2>
            {site.verified_at ? (
              <span className="badge-green flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="badge-amber flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                Not verified
              </span>
            )}
          </div>

          {lastScanDate && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5 ml-13">
              <Clock className="w-3.5 h-3.5" />
              Last scan {formatDate(lastScanDate)} · {latestScan?.pages_scanned ?? 0} pages ·{' '}
              {latestScan?.links_checked ?? 0} links
            </p>
          )}
          {!latestScan && site.verified_at && (
            <p className="text-sm text-slate-500 ml-13">No scans yet — first scan pending</p>
          )}
          {!site.verified_at && (
            <p className="text-sm text-amber-400 ml-13">
              Add verification meta tag to start scanning
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {issueCount > 0 ? (
            <div className="flex flex-col items-end">
              <span className="font-display text-3xl font-bold text-red-400">{issueCount}</span>
              <p className="text-xs text-slate-500">
                issue{issueCount !== 1 ? 's' : ''} found
              </p>
            </div>
          ) : latestScan ? (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 text-sm text-green-400 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                All good
              </span>
              <p className="text-xs text-slate-500 mt-1">No issues</p>
            </div>
          ) : null}
          <ExternalLink className="w-4 h-4 text-slate-600 mt-2 group-hover:text-green-400/50 transition-colors" />
        </div>
      </div>

      {/* Progress bar for visual interest */}
      {latestScan && (
        <div className="mt-4 ml-13">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
              style={{ 
                width: `${Math.max(0, 100 - (issueCount * 10))}%`,
                opacity: issueCount === 0 ? 1 : 0.3 + (Math.max(0, 100 - (issueCount * 10)) / 100) * 0.7
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
