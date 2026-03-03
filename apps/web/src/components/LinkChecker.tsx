'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Share2,
  Monitor,
  Smartphone,
  Info,
} from 'lucide-react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types (mirrors API response)                                       */
/* ------------------------------------------------------------------ */

interface HopInfo {
  url: string;
  status: number;
}

interface EnvResult {
  environmentId: string;
  label: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  finalStatus: number;
  finalUrl: string;
  chain: HopInfo[];
  redirectCount: number;
  affiliateTagPreserved: boolean | null;
  paramsLost: boolean;
  errorMessage: string | null;
  differsFromBaseline: boolean;
  issue: string | null;
}

interface CheckResponse {
  originalUrl: string;
  isAffiliate: boolean;
  affiliateParams: string[];
  environments: EnvResult[];
}

/* ------------------------------------------------------------------ */
/*  Environment icon helper                                            */
/* ------------------------------------------------------------------ */

function EnvIcon({ id }: { id: string }) {
  if (id === 'desktop_chrome' || id === 'android_chrome') {
    return <Monitor className="w-4 h-4 text-slate-400" />;
  }
  return <Smartphone className="w-4 h-4 text-slate-400" />;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function LinkChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState('');

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/check-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
      } else {
        setResult(data as CheckResponse);
      }
    } catch {
      setError('Could not complete the check. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input */}
      <div className="glass-card p-8">
        <form onSubmit={handleCheck} className="flex gap-3 mb-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://amzn.to/3abc123"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking…
              </span>
            ) : (
              <>
                Check link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {!result && !loading && !error && (
          <p className="text-center text-xs text-slate-500">
            Paste any URL — we&apos;ll test it across 6 browser environments to see if your affiliate tags survive.
          </p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 text-sm text-slate-400">
              <svg className="animate-spin w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing across 6 browser environments…
            </div>
          </div>
        )}

        {error && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && <ResultsMatrix result={result} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Results Matrix                                                     */
/* ------------------------------------------------------------------ */

function ResultsMatrix({ result }: { result: CheckResponse }) {
  const [expandedEnv, setExpandedEnv] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasIssues = result.environments.some((e) => e.paramsLost || e.status === 'broken');
  const strippedCount = result.environments.filter((e) => e.paramsLost).length;

  function handleShare() {
    const text = buildShareText(result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Summary header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-500 mb-1">Results for</p>
            <p className="font-mono text-sm text-slate-300 break-all">{result.originalUrl}</p>
            {result.isAffiliate && result.affiliateParams.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">
                  Affiliate params detected:{' '}
                  {result.affiliateParams.map((p) => (
                    <code key={p} className="font-mono bg-white/5 px-1 rounded mr-1">
                      {p}
                    </code>
                  ))}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Share results'}
          </button>
        </div>

        {/* Quick summary */}
        {hasIssues && (
          <div className="mt-4 border border-red-500/20 bg-red-500/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 font-medium">
                {strippedCount > 0
                  ? `Affiliate tag stripped in ${strippedCount} of 6 environments`
                  : 'Issues detected in some environments'}
              </span>
            </div>
          </div>
        )}

        {!hasIssues && result.isAffiliate && (
          <div className="mt-4 border border-green-500/20 bg-green-500/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 font-medium">
                Affiliate tags preserved across all 6 environments
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Environment matrix table */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_120px_90px_1fr] gap-2 px-5 py-3 border-b border-white/5 bg-white/5 text-xs font-medium text-slate-500">
          <span>Environment</span>
          <span>Status</span>
          <span>Affiliate Tag</span>
          <span>Redirects</span>
          <span>Issue</span>
        </div>

        {/* Rows */}
        {result.environments.map((env) => {
          const isExpanded = expandedEnv === env.environmentId;
          return (
            <div key={env.environmentId}>
              {/* Main row */}
              <button
                onClick={() => setExpandedEnv(isExpanded ? null : env.environmentId)}
                className="w-full text-left grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_90px_1fr] gap-2 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition-colors items-center"
              >
                {/* Environment */}
                <div className="flex items-center gap-2.5">
                  <EnvIcon id={env.environmentId} />
                  <span className="text-sm font-medium">{env.label}</span>
                  {env.differsFromBaseline && (
                    <span className="badge-amber text-[10px] px-1.5 py-0.5">Differs</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={env.status} finalStatus={env.finalStatus} />
                </div>

                {/* Affiliate tag */}
                <div>
                  <TagBadge preserved={env.affiliateTagPreserved} />
                </div>

                {/* Redirects */}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {env.redirectCount > 0 ? (
                    <>
                      {env.redirectCount} hop{env.redirectCount !== 1 ? 's' : ''}
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </>
                  ) : (
                    <span>Direct</span>
                  )}
                </div>

                {/* Issue */}
                <div className="text-xs">
                  {env.issue ? (
                    <span className={env.paramsLost ? 'text-red-400' : 'text-slate-400'}>
                      {env.issue}
                    </span>
                  ) : (
                    <span className="text-green-400/60">None</span>
                  )}
                </div>
              </button>

              {/* Expanded redirect chain */}
              {isExpanded && env.chain.length > 0 && (
                <div className="bg-slate-900/50 border-b border-white/5 px-5 py-3">
                  <p className="text-xs text-slate-500 mb-2">Redirect chain</p>
                  <div className="space-y-1">
                    {env.chain.map((hop, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-600 font-mono w-4 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex-shrink-0 ${
                            hop.status >= 200 && hop.status < 300
                              ? 'bg-green-500/20 text-green-400'
                              : hop.status >= 300 && hop.status < 400
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {hop.status}
                        </span>
                        <span className="font-mono text-slate-400 break-all">{hop.url}</span>
                      </div>
                    ))}
                  </div>
                  {env.finalUrl !== result.originalUrl && (
                    <div className="mt-2 text-xs">
                      <span className="text-slate-500">Final URL: </span>
                      <span className="font-mono text-slate-300 break-all">{env.finalUrl}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simulation caveat */}
      <div className="flex items-start gap-2.5 px-1">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          These results simulate how each platform&apos;s browser would handle this link based on
          headers and redirect behavior. Actual behavior may vary for JavaScript-based redirects.
        </p>
      </div>

      {/* CTA */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">
          {hasIssues
            ? 'Your links are losing attribution in some environments. Monitor all your links automatically.'
            : 'Want to monitor all your links automatically? Start free.'}
        </p>
        <Link href="/signup" className="btn-primary justify-center">
          Start monitoring free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Badges                                                             */
/* ------------------------------------------------------------------ */

function StatusBadge({ status, finalStatus }: { status: string; finalStatus: number }) {
  const code = finalStatus > 0 ? String(finalStatus) : '—';
  switch (status) {
    case 'ok':
    case 'redirect':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {code}
        </span>
      );
    case 'broken':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-400">
          <XCircle className="w-3.5 h-3.5" />
          {code}
        </span>
      );
    case 'timeout':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          Timeout
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          Error
        </span>
      );
  }
}

function TagBadge({ preserved }: { preserved: boolean | null }) {
  if (preserved === null) {
    return <span className="text-xs text-slate-500">N/A</span>;
  }
  if (preserved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        Preserved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      STRIPPED
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Share text builder                                                 */
/* ------------------------------------------------------------------ */

function buildShareText(result: CheckResponse): string {
  const lines = [
    `Link Check Results for: ${result.originalUrl}`,
    '',
    'Environment          | Status | Affiliate Tag | Redirects | Issue',
    '---------------------+--------+---------------+-----------+------',
  ];

  for (const env of result.environments) {
    const tag =
      env.affiliateTagPreserved === null
        ? 'N/A'
        : env.affiliateTagPreserved
          ? 'Preserved'
          : 'STRIPPED';
    const hops = env.redirectCount > 0 ? `${env.redirectCount} hops` : 'Direct';
    const issue = env.issue ?? 'None';
    lines.push(
      `${env.label.padEnd(21)}| ${String(env.finalStatus || '—').padEnd(7)}| ${tag.padEnd(14)}| ${hops.padEnd(10)}| ${issue}`,
    );
  }

  lines.push('', 'Checked with LinkRescue — https://linkrescue.io/link-checker');
  return lines.join('\n');
}
