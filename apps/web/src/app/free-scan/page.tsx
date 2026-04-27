import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { FreeScanForm } from '@/components/FreeScanForm';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const SITE_URL = 'https://www.linkrescue.io';
const PAGE_URL = `${SITE_URL}/free-scan`;

export const metadata: Metadata = {
  title: 'Free Broken Affiliate Link Scan',
  description:
    'Scan your entire site for broken affiliate links in under 2 minutes. See which links are losing you money and how much revenue you could recover. Free, no credit card.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Free Site Scan — Find Broken Affiliate Links',
    description:
      'We crawl up to 20 pages and check every outbound link. See exactly which affiliate links are broken and how much revenue you are losing.',
    url: PAGE_URL,
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Site Scan — Find Broken Affiliate Links',
    description:
      'Scan your site for broken affiliate links. See your revenue loss in under 2 minutes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free Affiliate Link Site Scanner',
  url: PAGE_URL,
  description:
    'Scan your entire website for broken affiliate links. Find out which links are costing you commissions.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  provider: { '@type': 'Organization', name: 'LinkRescue', url: SITE_URL },
};

export default function FreeScanPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background overflow-x-hidden">
        <PublicNav />

        <main className="container mx-auto px-6 pt-32 pb-24">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Free Site Scan
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              Find every <span className="text-gradient">broken affiliate link</span> on your site
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              We&apos;ll crawl up to 20 pages and check every outbound link. See exactly which
              affiliate links are broken and how much revenue you&apos;re losing.
            </p>
          </div>

          {/* Scan form / results */}
          <FreeScanForm />

          {/* What we check */}
          <div className="max-w-4xl mx-auto mt-20">
            <h2 className="font-display text-xl font-semibold text-center mb-8">
              What gets checked
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Dead links (4xx/5xx)',
                  desc: 'Affiliate links returning 404, 410, 500, or other error codes that silently kill your commissions.',
                },
                {
                  title: 'Redirect chains',
                  desc: 'Multi-hop redirects that drop your tracking parameters before reaching the merchant.',
                },
                {
                  title: 'Parameter stripping',
                  desc: 'Detect when your ref=, tag=, or affiliate ID gets silently removed during redirects.',
                },
                {
                  title: '38+ affiliate networks',
                  desc: 'Amazon, ShareASale, CJ, Impact, Awin, Rakuten, ClickBank, and 30+ more networks.',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-5">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mb-3" />
                  <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof — verified stats only */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">
              Built for affiliate marketers, content sites, and agencies that can&apos;t afford silent commission loss.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-slate-600 text-xs">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2.4M+</div>
                <div>Links checked across all scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">38+</div>
                <div>Networks supported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">$4.50</div>
                <div>Avg lost commission per broken affiliate link / month</div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="max-w-2xl mx-auto mt-16 gradient-border p-6 text-center">
            <p className="font-semibold mb-2">
              Want continuous monitoring?
            </p>
            <p className="text-sm text-slate-400 mb-6">
              LinkRescue checks every affiliate link on your site daily and alerts you
              the moment anything breaks. Start free with up to 200 pages.
            </p>
            <Link href="/signup" className="btn-primary justify-center">
              Start monitoring free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
