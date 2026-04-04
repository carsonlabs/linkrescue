import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Globe,
  Link2,
  AlertTriangle,
  DollarSign,
  XCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { createAdminClient } from '@linkrescue/database';

const SITE_URL = 'https://www.linkrescue.io';

interface BrokenLinkDetail {
  href: string;
  statusCode: number | null;
  isAffiliate: boolean;
  issueType: string;
  foundOnPage: string;
}

interface ScanData {
  id: string;
  domain: string;
  pages_scanned: number;
  total_links_checked: number;
  total_affiliate_links: number;
  broken_links_count: number;
  broken_affiliate_count: number;
  estimated_monthly_loss: number;
  broken_links: BrokenLinkDetail[];
  created_at: string;
}

function issueLabel(issueType: string): string {
  switch (issueType) {
    case 'BROKEN_4XX': return '404 Not Found';
    case 'SERVER_5XX': return 'Server Error';
    case 'TIMEOUT': return 'Timed Out';
    case 'REDIRECT_TO_HOME': return 'Redirects to Home';
    case 'LOST_PARAMS': return 'Params Stripped';
    case 'SOFT_404': return 'Soft 404';
    default: return 'Issue Detected';
  }
}

function issueColor(issueType: string): string {
  switch (issueType) {
    case 'BROKEN_4XX':
    case 'SERVER_5XX': return 'text-red-400';
    case 'TIMEOUT': return 'text-amber-400';
    default: return 'text-orange-400';
  }
}

function truncateUrl(url: string, maxLen = 60): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}

async function getScan(id: string): Promise<ScanData | null> {
  try {
    const db = createAdminClient();
    const { data } = await (db.from as Function)('free_scan_results')
      .select('*')
      .eq('id', id)
      .single();
    return data as ScanData | null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) return { title: 'Scan Not Found — LinkRescue' };

  const title = `${scan.domain} — ${scan.broken_links_count} Broken Links Found | LinkRescue`;
  const description = scan.broken_links_count > 0
    ? `We found ${scan.broken_links_count} broken links on ${scan.domain}, including ${scan.broken_affiliate_count} broken affiliate links costing ~$${scan.estimated_monthly_loss}/mo.`
    : `We scanned ${scan.pages_scanned} pages on ${scan.domain} and checked ${scan.total_links_checked} links. All clear!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/scan/${id}`,
      siteName: 'LinkRescue',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) notFound();

  const scanDate = new Date(scan.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNav />

      <main className="container mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 badge-green mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Scan Report
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4">
            <span className="text-gradient">{scan.domain}</span>
          </h1>
          <p className="text-sm text-slate-500">
            Scanned on {scanDate} &middot; {scan.pages_scanned} pages crawled
          </p>
        </div>

        {/* Summary cards */}
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon={<Globe className="w-5 h-5" />}
              label="Pages Scanned"
              value={scan.pages_scanned.toString()}
              color="text-blue-400"
            />
            <SummaryCard
              icon={<Link2 className="w-5 h-5" />}
              label="Broken Links"
              value={scan.broken_links_count.toString()}
              color={scan.broken_links_count > 0 ? 'text-red-400' : 'text-green-400'}
            />
            <SummaryCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Broken Affiliate Links"
              value={scan.broken_affiliate_count.toString()}
              color={scan.broken_affiliate_count > 0 ? 'text-orange-400' : 'text-green-400'}
            />
            <SummaryCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Est. Monthly Loss"
              value={scan.estimated_monthly_loss > 0 ? `$${Number(scan.estimated_monthly_loss).toFixed(0)}` : '$0'}
              color={scan.estimated_monthly_loss > 0 ? 'text-red-400' : 'text-green-400'}
            />
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mb-10">
            <span>{scan.total_links_checked} links checked</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>{scan.total_affiliate_links} affiliate links found</span>
          </div>

          {/* No broken links */}
          {scan.broken_links_count === 0 && (
            <div className="glass-card p-8 text-center mb-10">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All links look healthy!</h3>
              <p className="text-slate-400 text-sm mb-6">
                We scanned {scan.pages_scanned} pages and checked {scan.total_links_checked} outbound links.
                No broken links found at the time of this scan.
              </p>
            </div>
          )}

          {/* Broken links list */}
          {scan.broken_links_count > 0 && (
            <div className="space-y-4 mb-10">
              <h3 className="text-lg font-semibold">
                Broken Links Found
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({scan.broken_links_count} total)
                </span>
              </h3>

              {/* Show top 5 for public view */}
              {scan.broken_links.slice(0, 5).map((link, i) => (
                <div key={`${link.href}-${i}`} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="shrink-0">
                    <XCircle className={`w-5 h-5 ${issueColor(link.issueType)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-white truncate" title={link.href}>
                        {truncateUrl(link.href)}
                      </span>
                      {link.isAffiliate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Affiliate</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className={issueColor(link.issueType)}>
                        {issueLabel(link.issueType)}
                        {link.statusCode ? ` (${link.statusCode})` : ''}
                      </span>
                      <span className="truncate" title={link.foundOnPage}>
                        Found on: {truncateUrl(link.foundOnPage, 40)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-slate-500 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}

              {scan.broken_links.length > 5 && (
                <p className="text-center text-sm text-slate-500">
                  +{scan.broken_links.length - 5} more broken links found
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="gradient-border p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">
              Want to scan your own site?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Run a free scan on your website and find every broken affiliate link
              that&apos;s costing you commissions.
            </p>
            <Link href="/free-scan" className="btn-primary justify-center">
              Scan My Site Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-card p-5 text-center">
      <div className={`${color} mb-2 flex justify-center`}>{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
