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
  ExternalLink,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

type CheckStatus = 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';

interface CheckResult {
  status: CheckStatus;
  finalStatus: number;
  originalUrl: string;
  finalUrl: string;
  chain: { url: string; status: number }[];
  redirectCount: number;
  isAffiliate: boolean;
  affiliateParams: string[];
  paramsLost: boolean;
  errorMessage: string | null;
}

const STATUS_CONFIG: Record<
  CheckStatus,
  { label: string; color: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  ok: {
    label: 'Reachable',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    Icon: CheckCircle2,
  },
  broken: {
    label: 'Broken',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    Icon: XCircle,
  },
  redirect: {
    label: 'Redirecting',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    Icon: ArrowRight,
  },
  timeout: {
    label: 'Timed out',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    Icon: Clock,
  },
  error: {
    label: 'Error',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    Icon: AlertTriangle,
  },
};

export function LinkChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');
  const [showChain, setShowChain] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError('');
    setShowChain(false);

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
        setResult(data as CheckResult);
      }
    } catch {
      setError('Could not complete the check. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto">
      {/* Input */}
      <form onSubmit={handleCheck} className="flex gap-3 mb-6">
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

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && <ResultPanel result={result} showChain={showChain} setShowChain={setShowChain} />}

      {!result && !loading && (
        <p className="text-center text-xs text-slate-500">
          Paste any URL — affiliate links, Amazon links, redirect chains, anything.
        </p>
      )}
    </div>
  );
}

function ResultPanel({
  result,
  showChain,
  setShowChain,
}: {
  result: CheckResult;
  showChain: boolean;
  setShowChain: (v: boolean) => void;
}) {
  const cfg = STATUS_CONFIG[result.status];
  const Icon = cfg.Icon;

  return (
    <div className={`border ${cfg.border} ${cfg.bg} rounded-xl p-6 space-y-4`}>
      {/* Status header */}
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${cfg.color} flex-shrink-0`} />
        <div>
          <p className={`font-display text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
          {result.finalStatus > 0 && (
            <p className="text-xs text-slate-400">HTTP {result.finalStatus}</p>
          )}
          {result.errorMessage && (
            <p className="text-xs text-slate-400">{result.errorMessage}</p>
          )}
        </div>
      </div>

      {/* URL info */}
      <div className="space-y-2">
        {result.originalUrl !== result.finalUrl && (
          <div className="text-xs">
            <span className="text-slate-500">Original: </span>
            <span className="font-mono text-slate-400 break-all">{result.originalUrl}</span>
          </div>
        )}
        <div className="text-xs">
          <span className="text-slate-500">
            {result.originalUrl !== result.finalUrl ? 'Final: ' : 'URL: '}
          </span>
          <span className="font-mono text-slate-300 break-all">{result.finalUrl}</span>
        </div>
      </div>

      {/* Redirect chain */}
      {result.redirectCount > 0 && (
        <div>
          <button
            onClick={() => setShowChain(!showChain)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {showChain ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {result.redirectCount} redirect{result.redirectCount !== 1 ? 's' : ''} in chain
          </button>

          {showChain && (
            <div className="mt-3 space-y-1">
              {result.chain.map((hop, i) => (
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
          )}
        </div>
      )}

      {/* Affiliate param analysis */}
      {result.isAffiliate && (
        <div
          className={`border rounded-lg p-3 text-xs ${
            result.paramsLost
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'border-green-500/20 bg-green-500/5'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Shield
              className={`w-3.5 h-3.5 ${result.paramsLost ? 'text-amber-400' : 'text-green-400'}`}
            />
            <span className={result.paramsLost ? 'text-amber-400' : 'text-green-400'}>
              {result.paramsLost ? 'Affiliate parameters lost in redirect' : 'Affiliate parameters preserved'}
            </span>
          </div>
          {result.affiliateParams.length > 0 && (
            <p className="text-slate-400">
              Params detected:{' '}
              {result.affiliateParams.map((p) => (
                <code key={p} className="font-mono bg-white/5 px-1 rounded mr-1">
                  {p}
                </code>
              ))}
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-slate-400 mb-3">
          {result.status === 'broken'
            ? 'This link is broken — LinkRescue would have caught this automatically.'
            : result.paramsLost
              ? 'You\'re losing commissions on this link. LinkRescue monitors every redirect on your site.'
              : 'Monitor all your affiliate links automatically — get alerted the moment one breaks.'}
        </p>
        <Link href="/signup" className="btn-primary text-sm w-full justify-center">
          Monitor my site free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
