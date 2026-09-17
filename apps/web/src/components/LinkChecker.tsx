'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Info, Shield } from 'lucide-react';

interface HopInfo { url: string; status: number; jsRedirect?: boolean }
interface ParamDetail { param: string; originalValue: string; survived: boolean; finalValue: string | null }
interface Environment {
  environmentId: string;
  label: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  finalStatus: number;
  finalUrl: string;
  chain: HopInfo[];
  redirectCount: number;
  affiliateTagPreserved: boolean | null;
  paramsLost: boolean;
  paramDetails: ParamDetail[];
  issue: string | null;
}
interface CheckResponse {
  originalUrl: string;
  isAffiliate: boolean;
  affiliateParams: string[];
  detectedNetwork: string | null;
  environments: Environment[];
}

export function LinkChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState('');

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/check-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Something went wrong. Please try again.');
      else setResult(data as CheckResponse);
    } catch {
      setError('Could not complete the check. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8">
        <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/offer?tag=publisher" className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 font-mono" />
          <button type="submit" disabled={loading || !url.trim()} className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Checking…' : <>Check link <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        {!result && !loading && !error && <p className="text-center text-xs text-slate-500 mt-4">Checks HTTP status, redirect paths, and standard tracking parameters. It does not simulate a real browser or app.</p>}
        {error && <p className="mt-4 border border-red-500/20 bg-red-500/5 rounded-xl p-4 text-sm text-red-400">{error}</p>}
      </div>
      {result && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: CheckResponse }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasIssues = result.environments.some((env) => env.paramsLost || env.status === 'broken');
  return (
    <>
      <section className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Header-based check</p>
            <p className="font-mono text-sm text-slate-200 break-all mt-1">{result.originalUrl}</p>
            {result.detectedNetwork && <p className="flex items-center gap-2 text-xs text-slate-400 mt-2"><Shield className="w-3.5 h-3.5" /> Detected network: {result.detectedNetwork}</p>}
          </div>
          <div className={hasIssues ? 'text-amber-400 text-sm font-medium' : 'text-green-400 text-sm font-medium'}>
            {hasIssues ? 'Technical issue detected' : 'No technical issue detected'}
          </div>
        </div>
        <div className="flex gap-2 mt-5 p-3 rounded-lg bg-slate-900/50 text-xs text-slate-400 leading-relaxed"><Info className="w-4 h-4 shrink-0 mt-0.5" /> Header checks can differ from real browsers because they do not execute JavaScript or reproduce cookies, app webviews, or bot protections.</div>
      </section>
      <section className="glass-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_110px_120px_95px_1fr] gap-3 px-5 py-3 bg-white/5 text-xs text-slate-500"><span>Check profile</span><span>Status</span><span>Tracking</span><span>Redirects</span><span>Issue</span></div>
        {result.environments.map((env) => {
          const open = expanded === env.environmentId;
          return <div key={env.environmentId} className="border-t border-white/5 first:border-0">
            <button onClick={() => setExpanded(open ? null : env.environmentId)} className="w-full text-left grid grid-cols-1 md:grid-cols-[1fr_110px_120px_95px_1fr] gap-2 md:gap-3 px-5 py-4 hover:bg-white/[0.03]">
              <span className="font-medium text-sm">{env.label}</span>
              <Status status={env.status} code={env.finalStatus} />
              <span className={env.affiliateTagPreserved === false ? 'text-red-400 text-xs' : 'text-slate-400 text-xs'}>{env.affiliateTagPreserved === null ? 'None detected' : env.affiliateTagPreserved ? 'Visible' : 'Not preserved'}</span>
              <span className="text-xs text-slate-400">{env.redirectCount ? `${env.redirectCount} hop${env.redirectCount === 1 ? '' : 's'}` : 'Direct'} {open ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}</span>
              <span className="text-xs text-slate-400">{env.issue ?? 'None'}</span>
            </button>
            {open && <div className="px-5 pb-4 text-xs space-y-3">
              <div><p className="text-slate-500 mb-2">Redirect path</p>{env.chain.map((hop, index) => <p key={`${hop.url}-${index}`} className="font-mono text-slate-400 break-all mb-1">{index + 1}. {hop.status || '?'} {hop.url}</p>)}</div>
              {env.paramDetails.length > 0 && <div><p className="text-slate-500 mb-2">Visible parameter checks</p>{env.paramDetails.map((param) => <p key={param.param} className={param.survived ? 'text-green-400' : 'text-red-400'}>{param.param}: {param.survived ? 'visible after redirect' : 'not visible after redirect'}</p>)}</div>}
            </div>}
          </div>;
        })}
      </section>
      <section className="gradient-border p-6 text-center">
        <p className="font-semibold mb-2">Need a broader recovery review?</p>
        <p className="text-sm text-slate-400 mb-5">A free leak snapshot checks a small public sample. Recovery Sprints add human review and a prioritized repair scope.</p>
        <Link href="/free-scan" className="btn-primary justify-center">Get a leak snapshot <ArrowRight className="w-4 h-4" /></Link>
      </section>
    </>
  );
}

function Status({ status, code }: { status: Environment['status']; code: number }) {
  const color = status === 'broken' || status === 'error' ? 'text-red-400' : status === 'timeout' ? 'text-amber-400' : 'text-green-400';
  return <span className={`text-xs ${color}`}>{code || status}</span>;
}
