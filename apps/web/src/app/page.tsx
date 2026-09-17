import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileSearch, Link2, ShieldCheck, Wrench } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Affiliate Link Recovery',
  description:
    'Scoped affiliate link checks, recovery sprints, and managed monitoring after a readiness review.',
  alternates: { canonical: 'https://www.linkrescue.io' },
};

const steps = [
  { icon: FileSearch, title: '1. Get a free leak snapshot', text: 'A limited review of public pages, outbound links, redirects, and visible tracking parameters.' },
  { icon: ShieldCheck, title: '2. Review the evidence', text: 'See what the snapshot found and understand its technical limits before committing to any work.' },
  { icon: Wrench, title: '3. Run a Recovery Sprint', text: 'For a fit site, receive a human-led repair scope and a prioritized implementation list for $499.' },
  { icon: Link2, title: '4. Add managed monitoring', text: 'After a readiness review, eligible sites can move to a monthly human-reviewed monitoring desk.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNav />
      <main>
        <section className="relative pt-36 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 badge-green mb-7">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Service-led pilot for affiliate publishers
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.98] tracking-tight">
                Turn affiliate link failures into{' '}
                <span className="text-gradient">a clear recovery plan.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mt-8">
                LinkRescue starts with technical evidence, then helps qualified publishers repair
                broken links and redirect failures through a scoped Recovery Sprint.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                <Link href="/free-scan" className="btn-primary justify-center text-base px-7 py-4">
                  Get a free leak snapshot <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/pricing" className="btn-secondary justify-center text-base px-7 py-4">
                  View recovery options
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8 text-sm text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> No credit card</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> No revenue estimates</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Human follow-up for fit sites</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-y border-white/5 bg-white/[0.015]">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-sm text-green-400 uppercase tracking-widest font-semibold mb-4">Research, not a promise</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold">Why inspect an older content archive?</h2>
              <p className="text-slate-400 mt-5 text-lg">In a June 2026 research scan of 50 established affiliate sites, LinkRescue reviewed 683 pages and 6,550 outbound links.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
              <Stat value="5.8%" label="visibly broken links in the research scan" />
              <Stat value="9.1%" label="attribution failures in the research scan" />
              <Stat value="27" label="median issues per site in the research scan" />
            </div>
            <p className="text-center text-xs text-slate-600 mt-8">These are research observations from the stated crawl budget, not a forecast of results or revenue for any site.</p>
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl font-bold">A practical path from <span className="text-gradient-purple">signal to repair</span></h2>
              <p className="text-lg text-slate-400 mt-6">No automated billing, no fake urgency, and no claim that a technical check can calculate your revenue.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {steps.map((step) => {
                const Icon = step.icon;
                return <article key={step.title} className="glass-card p-6">
                  <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center mb-5"><Icon className="w-5 h-5 text-green-400" /></div>
                  <h3 className="font-display text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{step.text}</p>
                </article>;
              })}
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 max-w-6xl">
            <div>
              <p className="text-sm text-green-400 uppercase tracking-widest font-semibold mb-4">Who it is for</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">International publisher businesses with an archive worth maintaining.</h2>
              <p className="text-slate-400 leading-relaxed">The pilot is designed for boutique content and SEO agencies managing at least five affiliate sites, plus independent publishers with roughly 100 or more public content pages.</p>
            </div>
            <div className="space-y-4">
              {['Product review and comparison archives', 'Niche publishers with older tutorials and roundups', 'Agencies responsible for client content portfolios'].map((item) => <div key={item} className="glass-card p-5 flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /><span className="text-slate-300">{item}</span></div>)}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto gradient-border p-9">
              <p className="badge-green inline-flex mb-5">Start with evidence</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-5">See whether your archive is a fit for recovery work.</h2>
              <p className="text-slate-400 mb-8">The leak snapshot is free. Paid work begins only after the proposed scope is clear.</p>
              <Link href="/free-scan" className="btn-primary justify-center text-base px-8 py-4">Get a free leak snapshot <ArrowRight className="w-5 h-5" /></Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="glass-card p-7"><p className="font-display text-4xl font-bold text-white">{value}</p><p className="text-sm text-slate-500 mt-2">{label}</p></div>;
}
