import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Zap,
  Shield,
  Clock,
  Link2,
  Search,
  Webhook,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Broken Link API — Check Links Programmatically | LinkRescue',
  description:
    'REST API to detect broken links, stripped affiliate parameters, and redirect chain issues. Check single URLs or crawl entire sites. curl-ready in 30 seconds.',
  alternates: {
    canonical: 'https://www.linkrescue.io/api-landing',
  },
  openGraph: {
    title: 'Broken Link API — LinkRescue',
    description:
      'REST API to detect broken links, stripped affiliate params, and redirect issues. Built for developers and SEO tools.',
    url: 'https://www.linkrescue.io/api-landing',
    siteName: 'LinkRescue',
    type: 'website',
  },
};

const USE_CASES = [
  {
    icon: Link2,
    title: 'Affiliate Link Monitoring',
    description: 'Detect when affiliate parameters get stripped during redirects. Catch revenue leaks before they compound.',
  },
  {
    icon: Search,
    title: 'SEO Tool Integration',
    description: 'Pipe URLs from your CMS or SEO crawler into the API. Get broken link data without building your own checker.',
  },
  {
    icon: Webhook,
    title: 'CI/CD Pipelines',
    description: 'Check outbound links before deploying content. Catch dead links in staging, not production.',
  },
  {
    icon: Clock,
    title: 'Scheduled Monitoring',
    description: 'Full async site scans with webhook callbacks. Know the moment a link breaks on your site.',
  },
];

const FEATURES = [
  'Redirect chain following (up to 10 hops)',
  'Affiliate parameter survival detection',
  '30+ affiliate network recognition',
  'SSRF-safe (DNS-aware IP validation)',
  'Batch up to 20 URLs per request',
  'Async site scans with webhook callback',
  'Rate limit headers on every response',
  'CORS enabled for browser usage',
];

export default function ApiLandingPage() {
  const baseUrl = 'https://app.linkrescue.io';

  return (
    <>
      <PublicNav />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 mb-6">
            <Terminal className="w-3 h-3" />
            REST API
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Broken link detection
            <br />
            <span className="text-gradient">as an API</span>
          </h1>
          <p className="text-slate-400 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
            Check URLs for broken links, stripped affiliate parameters, and redirect chain issues.
            One POST request. Results in seconds.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <Link href="/signup" className="btn-primary">
              Get API Key <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary"
            >
              View Docs
            </Link>
          </div>
        </section>

        {/* Code example */}
        <section className="container mx-auto px-6 mt-20 max-w-2xl">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-slate-500 font-mono ml-2">Terminal</span>
            </div>
            <pre className="p-5 text-sm overflow-x-auto leading-relaxed">
              <code>
                <span className="text-slate-500">$ </span>
                <span className="text-green-400">curl</span>
                <span className="text-slate-300">{` -X POST ${baseUrl}/api/v1/check-links \\`}</span>
                {'\n'}
                <span className="text-slate-300">{'  -H '}</span>
                <span className="text-purple-400">{`"Authorization: Bearer lr_your_key"`}</span>
                <span className="text-slate-300">{` \\`}</span>
                {'\n'}
                <span className="text-slate-300">{'  -H '}</span>
                <span className="text-purple-400">{`"Content-Type: application/json"`}</span>
                <span className="text-slate-300">{` \\`}</span>
                {'\n'}
                <span className="text-slate-300">{'  -d '}</span>
                <span className="text-amber-300">{`'{"url": "https://amzn.to/abc123"}'`}</span>
                {'\n\n'}
                <span className="text-slate-500">{'// Response'}</span>
                {'\n'}
                <span className="text-slate-300">{`{`}</span>
                {'\n'}
                <span className="text-slate-300">{'  '}</span>
                <span className="text-green-400">{`"checked"`}</span>
                <span className="text-slate-300">{`: 1,`}</span>
                {'\n'}
                <span className="text-slate-300">{'  '}</span>
                <span className="text-green-400">{`"summary"`}</span>
                <span className="text-slate-300">{`: { "broken": 0, "redirects": 1 },`}</span>
                {'\n'}
                <span className="text-slate-300">{'  '}</span>
                <span className="text-green-400">{`"results"`}</span>
                <span className="text-slate-300">{`: [{`}</span>
                {'\n'}
                <span className="text-slate-300">{'    '}</span>
                <span className="text-green-400">{`"status"`}</span>
                <span className="text-slate-300">{`: "redirect",`}</span>
                {'\n'}
                <span className="text-slate-300">{'    '}</span>
                <span className="text-green-400">{`"affiliate_params_preserved"`}</span>
                <span className="text-slate-300">{`: true`}</span>
                {'\n'}
                <span className="text-slate-300">{`  }]`}</span>
                {'\n'}
                <span className="text-slate-300">{`}`}</span>
              </code>
            </pre>
          </div>
        </section>

        {/* Use Cases */}
        <section className="container mx-auto px-6 mt-28 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center tracking-tight mb-4">
            Built for developers who manage links at scale
          </h2>
          <p className="text-slate-400 text-center max-w-lg mx-auto mb-12">
            Whether you're an affiliate site, SEO tool, or content platform — broken links cost money.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="glass-card p-6 group hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <uc.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{uc.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Endpoints */}
        <section className="container mx-auto px-6 mt-28 max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center tracking-tight mb-12">
            Four endpoints. Full workflow.
          </h2>

          <div className="space-y-4">
            {/* Check Links */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold bg-green-500/20 text-green-400 px-2.5 py-1 rounded">
                  POST
                </span>
                <code className="text-sm text-slate-300 font-mono">/api/v1/check-links</code>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                  Pro+
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Check 1–20 URLs synchronously. Returns status codes, redirect chains, and affiliate param survival.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Sync response</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Batch support</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">100 req/hour</span>
              </div>
            </div>

            {/* Async Scan */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded">
                  POST
                </span>
                <code className="text-sm text-slate-300 font-mono">/api/v1/scans</code>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                  Agency
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Crawl an entire site asynchronously. Submit a domain, get a scan ID, poll or receive a webhook when done.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Async (202)</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Webhook callback</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">10 scans/day</span>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded">
                  POST
                </span>
                <code className="text-sm text-slate-300 font-mono">/api/v1/monitors</code>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                  Agency
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Put a site on a recurring monitoring schedule for always-on health checks and agent workflows.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Daily / weekly / monthly</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Returns next scan time</span>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded">
                  POST
                </span>
                <code className="text-sm text-slate-300 font-mono">/api/v1/suggestions</code>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full ml-auto">
                  Agency
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Turn broken-link findings into prioritized remediation guidance from either a scan ID or a raw report.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Agent-friendly output</span>
                <span className="text-xs bg-white/5 text-slate-500 px-2 py-1 rounded">Supports scan_id or broken_links</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features list */}
        <section className="container mx-auto px-6 mt-28 max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center tracking-tight mb-12">
            Production-grade link checking
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="container mx-auto px-6 mt-28 max-w-3xl text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-slate-400 mb-10">
            API access starts at Pro. Pay monthly, cancel anytime.
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
            <div className="glass-card p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pro</p>
              <p className="font-display text-3xl font-bold">$29<span className="text-base font-normal text-slate-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 100 check-links requests/hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 2 site scans/day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 10,000 pages/month</li>
              </ul>
            </div>
            <div className="glass-card p-6 text-left border-green-500/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-1">Agency</p>
              <p className="font-display text-3xl font-bold">$79<span className="text-base font-normal text-slate-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 1,000 check-links requests/hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 10 site scans/day</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 100,000 pages/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Webhooks + Slack</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 mt-28 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">
            First API call in 30 seconds
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Sign up, generate an API key, and check your first link. No credit card required for the free tier.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
            Get Your API Key <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
