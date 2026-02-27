import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LinkChecker } from '@/components/LinkChecker';

const SITE_URL = 'https://linkrescue.io';
const PAGE_URL = `${SITE_URL}/link-checker`;

export const metadata: Metadata = {
  title: 'Free Affiliate Link Checker — Instant URL Health Check | LinkRescue',
  description:
    'Instantly check any URL for broken links, redirect chains, and lost affiliate tracking parameters. Free tool — no sign-up required.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Free Affiliate Link Checker',
    description:
      'Instantly check any URL for broken links, redirect chains, and lost affiliate tracking parameters.',
    url: PAGE_URL,
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Affiliate Link Checker',
    description:
      'Instantly check any URL for broken links, redirect chains, and lost affiliate tracking parameters.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Affiliate Link Checker',
  url: PAGE_URL,
  description:
    'Check any affiliate link for broken URLs, redirect chains, and lost tracking parameters.',
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
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
                <ExternalLink className="w-4 h-4 text-slate-900" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">LinkRescue</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 pt-32 pb-24">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Free · No sign-up required
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              Check any affiliate link{' '}
              <span className="text-gradient">instantly</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Paste any URL to see its HTTP status, full redirect chain, and whether your affiliate
              tracking parameters survive the journey.
            </p>
          </div>

          {/* Tool */}
          <LinkChecker />

          {/* What we check */}
          <div className="max-w-2xl mx-auto mt-16">
            <h2 className="font-display text-xl font-semibold text-center mb-8">
              What gets checked
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
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
                  desc: 'Detect if your ref=, tag=, or aff= parameters are stripped by a redirect.',
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

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <ExternalLink className="w-3 h-3 text-slate-900" />
              </div>
              <span className="font-display font-bold text-white">LinkRescue</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p>© {new Date().getFullYear()} LinkRescue</p>
          </div>
        </footer>
      </div>
    </>
  );
}
