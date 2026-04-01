'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Search,
  Mail,
  ArrowRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lock,
  Loader2,
  ExternalLink,
  DollarSign,
  Globe,
  Link2,
  Shield,
  Clock,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BrokenLinkDetail {
  href: string;
  statusCode: number | null;
  isAffiliate: boolean;
  issueType: string;
  foundOnPage: string;
}

interface ScanResult {
  domain: string;
  pagesScanned: number;
  totalLinksChecked: number;
  totalAffiliateLinks: number;
  brokenLinksCount: number;
  brokenAffiliateCount: number;
  estimatedMonthlyLoss: number;
  brokenLinks: BrokenLinkDetail[];
}

type ScanState = 'idle' | 'scanning' | 'done' | 'error';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function issueLabel(issueType: string): string {
  switch (issueType) {
    case 'BROKEN_4XX':
      return '404 Not Found';
    case 'SERVER_5XX':
      return 'Server Error';
    case 'TIMEOUT':
      return 'Timed Out';
    case 'REDIRECT_TO_HOME':
      return 'Redirects to Home';
    case 'LOST_PARAMS':
      return 'Params Stripped';
    case 'SOFT_404':
      return 'Soft 404';
    case 'CONTENT_CHANGED':
      return 'Content Changed';
    default:
      return 'Issue Detected';
  }
}

function issueColor(issueType: string): string {
  switch (issueType) {
    case 'BROKEN_4XX':
    case 'SERVER_5XX':
      return 'text-red-400';
    case 'TIMEOUT':
      return 'text-amber-400';
    case 'REDIRECT_TO_HOME':
    case 'LOST_PARAMS':
    case 'SOFT_404':
      return 'text-orange-400';
    default:
      return 'text-amber-400';
  }
}

function truncateUrl(url: string, maxLen: number = 60): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}

/* ------------------------------------------------------------------ */
/*  Progress messages                                                  */
/* ------------------------------------------------------------------ */

const PROGRESS_MESSAGES = [
  'Discovering pages on your site...',
  'Found pages, extracting outbound links...',
  'Checking affiliate links across 38+ networks...',
  'Following redirect chains...',
  'Detecting broken and stripped parameters...',
  'Almost done, compiling your report...',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FreeScanForm() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!url.trim() || !email.trim()) return;

      setState('scanning');
      setError(null);
      setProgressIdx(0);

      // Cycle progress messages while scanning
      const interval = setInterval(() => {
        setProgressIdx((prev) =>
          prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 8000);

      try {
        const res = await fetch('/api/free-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), email: email.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Something went wrong. Please try again.');
          setState('error');
          return;
        }

        setResult(data as ScanResult);
        setState('done');
      } catch {
        setError('Network error. Please check your connection and try again.');
        setState('error');
      } finally {
        clearInterval(interval);
      }
    },
    [url, email]
  );

  /* ---- Idle / Error: Show the form ---- */
  if (state === 'idle' || state === 'error') {
    return (
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {/* URL input */}
          <div>
            <label htmlFor="scan-url" className="block text-sm font-medium mb-2 text-slate-300">
              Your website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="scan-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(260_20%_18%)] border border-[hsl(260_20%_25%)] text-white placeholder:text-slate-500 focus:outline-none focus:border-[hsl(145_100%_55%/0.5)] focus:ring-1 focus:ring-[hsl(145_100%_55%/0.3)] transition-colors"
              />
            </div>
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="scan-email" className="block text-sm font-medium mb-2 text-slate-300">
              Email for your report
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="scan-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(260_20%_18%)] border border-[hsl(260_20%_25%)] text-white placeholder:text-slate-500 focus:outline-none focus:border-[hsl(145_100%_55%/0.5)] focus:ring-1 focus:ring-[hsl(145_100%_55%/0.3)] transition-colors"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-primary w-full justify-center text-base py-4">
            <Search className="w-5 h-5" />
            Scan My Site Free
          </button>
        </form>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-400/70" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-green-400/70" />
            Results in under 2 minutes
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-green-400/70" />
            Checks 38+ affiliate networks
          </span>
        </div>
      </div>
    );
  }

  /* ---- Scanning: Progress state ---- */
  if (state === 'scanning') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="glass-card p-10 text-center space-y-6">
          {/* Animated spinner */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[hsl(260_20%_25%)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[hsl(145_100%_55%)] animate-spin" />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-green-400 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Scanning {url.replace(/^https?:\/\//, '')}</h3>
            <p className="text-sm text-slate-400 transition-all duration-500">
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[hsl(260_20%_18%)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-[8000ms] ease-linear"
              style={{ width: `${Math.min(((progressIdx + 1) / PROGRESS_MESSAGES.length) * 100, 95)}%` }}
            />
          </div>

          <p className="text-xs text-slate-600">
            Crawling up to 20 pages and checking every outbound link...
          </p>
        </div>
      </div>
    );
  }

  /* ---- Done: Teaser results ---- */
  if (state === 'done' && result) {
    const topBroken = result.brokenLinks.slice(0, 3);
    const hiddenBroken = result.brokenLinks.slice(3);
    const hasHidden = hiddenBroken.length > 0;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Globe className="w-5 h-5" />}
            label="Pages Scanned"
            value={result.pagesScanned.toString()}
            color="text-blue-400"
          />
          <SummaryCard
            icon={<Link2 className="w-5 h-5" />}
            label="Broken Links"
            value={result.brokenLinksCount.toString()}
            color={result.brokenLinksCount > 0 ? 'text-red-400' : 'text-green-400'}
          />
          <SummaryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Broken Affiliate Links"
            value={result.brokenAffiliateCount.toString()}
            color={result.brokenAffiliateCount > 0 ? 'text-orange-400' : 'text-green-400'}
          />
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Est. Monthly Loss"
            value={result.estimatedMonthlyLoss > 0 ? `$${result.estimatedMonthlyLoss.toFixed(0)}` : '$0'}
            color={result.estimatedMonthlyLoss > 0 ? 'text-red-400' : 'text-green-400'}
          />
        </div>

        {/* Scan stats bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <span>{result.totalLinksChecked} links checked</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>{result.totalAffiliateLinks} affiliate links found</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>{result.domain}</span>
        </div>

        {/* No issues found */}
        {result.brokenLinksCount === 0 && (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your links look healthy!</h3>
            <p className="text-slate-400 text-sm mb-6">
              We scanned {result.pagesScanned} pages and checked {result.totalLinksChecked} outbound links.
              No broken links found right now, but links break over time as affiliate programs
              change URLs and sunset products.
            </p>
            <Link href={`/signup?email=${encodeURIComponent(email)}`} className="btn-primary justify-center">
              Set up free monitoring
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Broken links list */}
        {result.brokenLinksCount > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Broken Links Found
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({result.brokenLinksCount} total)
              </span>
            </h3>

            {/* Top 3: fully visible */}
            {topBroken.map((link, i) => (
              <BrokenLinkCard key={`${link.href}-${i}`} link={link} />
            ))}

            {/* Hidden links: blurred */}
            {hasHidden && (
              <div className="relative">
                {/* Show 2 blurred cards as teasers */}
                <div className="space-y-4 filter blur-[6px] pointer-events-none select-none" aria-hidden>
                  {hiddenBroken.slice(0, 2).map((link, i) => (
                    <BrokenLinkCard key={`hidden-${i}`} link={link} />
                  ))}
                </div>

                {/* Gate overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[hsl(260_25%_8%/0.7)] backdrop-blur-sm rounded-xl">
                  <Lock className="w-8 h-8 text-slate-400 mb-3" />
                  <p className="text-lg font-semibold mb-1">
                    +{hiddenBroken.length} more broken link{hiddenBroken.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-sm text-slate-400 mb-5">
                    Sign up free to see your full report with fix suggestions
                  </p>
                  <Link
                    href={`/signup?email=${encodeURIComponent(email)}`}
                    className="btn-primary justify-center"
                  >
                    Get Your Full Report Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Bottom CTA if all links shown (3 or fewer broken) */}
            {!hasHidden && (
              <div className="gradient-border p-6 text-center mt-6">
                <p className="font-semibold mb-2">
                  Links break silently every day.
                </p>
                <p className="text-sm text-slate-400 mb-5">
                  Set up free monitoring and we&apos;ll email you the moment any affiliate link breaks
                  so you never lose another commission.
                </p>
                <Link
                  href={`/signup?email=${encodeURIComponent(email)}`}
                  className="btn-primary justify-center"
                >
                  Start Free Monitoring
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

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

function BrokenLinkCard({ link }: { link: BrokenLinkDetail }) {
  return (
    <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="shrink-0">
        <XCircle className={`w-5 h-5 ${issueColor(link.issueType)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm text-white truncate" title={link.href}>
            {truncateUrl(link.href)}
          </span>
          {link.isAffiliate && (
            <span className="badge-amber shrink-0">Affiliate</span>
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
        title="Open link"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
