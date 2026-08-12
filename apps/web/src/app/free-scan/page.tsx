import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { FreeScanForm } from '@/components/FreeScanForm';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const SITE_URL = 'https://www.linkrescue.io';
const PAGE_URL = `${SITE_URL}/free-scan`;

export const metadata: Metadata = {
  title: 'Free Affiliate Link Leak Snapshot',
  description:
    'Get a limited, browser-based snapshot of broken outbound affiliate links. Free and no credit card required.',
  alternates: { canonical: PAGE_URL },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free Affiliate Link Leak Snapshot',
  url: PAGE_URL,
  description: 'A limited browser-based review for broken outbound links and redirect problems.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  provider: { '@type': 'Organization', name: 'LinkRescue', url: SITE_URL },
};

export default function FreeScanPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <PublicNav />
        <main className="container mx-auto px-6 pt-32 pb-24">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Free Leak Snapshot
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              Get a scoped <span className="text-gradient">affiliate link leak snapshot</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Enter a site to run a limited review of publicly reachable pages and outbound links.
              It highlights technical issues for a human follow-up; it does not estimate revenue.
            </p>
          </div>

          <FreeScanForm />

          <section className="max-w-4xl mx-auto mt-20">
            <h2 className="font-display text-xl font-semibold text-center mb-8">What gets checked</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Dead links (4xx/5xx)', desc: 'Outbound links returning 404, 410, 500, or other error codes.' },
                { title: 'Redirect chains', desc: 'Multi-hop redirects that may make a link harder to verify or repair.' },
                { title: 'Parameter visibility', desc: 'Checks for standard tracking parameters present in the URL after redirects.' },
                { title: 'Publisher-oriented checks', desc: 'Built to make common affiliate URLs and redirect paths easier to review.' },
              ].map((item) => (
                <div key={item.title} className="glass-card p-5">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mb-3" />
                  <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-2xl mx-auto mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">
              June 2026 research scan: 50 established affiliate sites, 683 pages, and 6,550 outbound links reviewed.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-slate-600 text-xs">
              <div><div className="text-2xl font-bold text-white">5.8%</div><div>Visibly broken in the research scan</div></div>
              <div><div className="text-2xl font-bold text-white">9.1%</div><div>Attribution failures in the research scan</div></div>
              <div><div className="text-2xl font-bold text-white">27</div><div>Median issues per site in the research scan</div></div>
            </div>
          </section>

          <section className="max-w-2xl mx-auto mt-16 gradient-border p-6 text-center">
            <p className="font-semibold mb-2">Need a deeper recovery review?</p>
            <p className="text-sm text-slate-400 mb-6">
              Recovery Sprints turn a scoped snapshot into a prioritized repair list. Managed monitoring is available only after a site is reviewed for readiness.
            </p>
            <Link href="/pricing" className="btn-primary justify-center">View recovery options <ArrowRight className="w-4 h-4" /></Link>
          </section>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
