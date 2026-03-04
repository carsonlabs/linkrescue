import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LinkChecker } from '@/components/LinkChecker';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const SITE_URL = 'https://www.linkrescue.io';
const PAGE_URL = `${SITE_URL}/link-checker`;

export const metadata: Metadata = {
  title: 'Free Affiliate Link Checker — Multi-Environment URL Test | LinkRescue',
  description:
    'Test any affiliate link across 6 browser environments — Desktop Chrome, Mobile Safari, Instagram, Facebook, TikTok, and Android. See where your tracking parameters get stripped. Free, no sign-up.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Free Affiliate Link Checker — Multi-Environment Test',
    description:
      'See how your affiliate link behaves in Instagram, TikTok, Safari, and more. Catch silent attribution failures.',
    url: PAGE_URL,
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Affiliate Link Checker — Multi-Environment Test',
    description:
      'See how your affiliate link behaves in Instagram, TikTok, Safari, and more. Catch silent attribution failures.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Affiliate Link Checker — Multi-Environment Test',
  url: PAGE_URL,
  description:
    'Test any affiliate link across 6 browser environments to detect broken links, redirect chains, and silent attribution failures.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  provider: { '@type': 'Organization', name: 'LinkRescue', url: SITE_URL },
};

export default function LinkCheckerPage() {
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
              Free · No sign-up required
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              Test your link across{' '}
              <span className="text-gradient">6 browser environments</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Paste any URL to see how it behaves in Desktop Chrome, Mobile Safari, Instagram, Facebook,
              TikTok, and Android. Find out where your affiliate tags get silently stripped.
            </p>
          </div>

          {/* Tool */}
          <LinkChecker />

          {/* What we check */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="font-display text-xl font-semibold text-center mb-8">
              What gets checked
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'HTTP status',
                  desc: 'See if the link returns 200 OK, a 4xx error, or a server failure.',
                },
                {
                  title: 'Redirect chain',
                  desc: 'Trace every hop from the original URL to its final destination.',
                },
                {
                  title: 'Affiliate params',
                  desc: 'Detect if your ref=, tag=, awc=, or irclickid= parameters are stripped.',
                },
                {
                  title: 'Environment testing',
                  desc: 'See how your link behaves in Instagram, TikTok, Safari ITP, and other environments.',
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

          {/* Upsell */}
          <div className="max-w-2xl mx-auto mt-12 gradient-border p-6 text-center">
            <p className="font-semibold mb-2">
              Checking links manually doesn&apos;t scale.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              LinkRescue automatically checks every affiliate link on your entire site every night
              and emails you the moment anything breaks — so you never lose a commission silently.
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
