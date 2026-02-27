import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { RevenueCalculator } from '@/components/RevenueCalculator';

const SITE_URL = 'https://linkrescue.io';
const PAGE_URL = `${SITE_URL}/affiliate-link-revenue-calculator`;

export const metadata: Metadata = {
  title: 'Affiliate Link Revenue Loss Calculator | LinkRescue',
  description:
    'Find out exactly how much revenue you lose each month to broken and expired affiliate links. Free calculator — get your personalized report in 30 seconds.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Affiliate Link Revenue Loss Calculator',
    description:
      'Find out exactly how much revenue you lose each month to broken and expired affiliate links.',
    url: PAGE_URL,
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affiliate Link Revenue Loss Calculator',
    description:
      'Find out exactly how much revenue you lose each month to broken and expired affiliate links.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Affiliate Link Revenue Loss Calculator',
  url: PAGE_URL,
  description:
    'Calculate how much revenue your affiliate site loses each month to broken, expired, and misconfigured links.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: {
    '@type': 'Organization',
    name: 'LinkRescue',
    url: SITE_URL,
  },
};

export default function CalculatorPage() {
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

        {/* Page content */}
        <main className="container mx-auto px-6 pt-32 pb-24">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Free revenue calculator
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              How much are broken affiliate links{' '}
              <span className="text-gradient">costing you?</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Adjust the sliders to match your site. Your estimated monthly loss updates live — then
              unlock your personalised annual report in one click.
            </p>
          </div>

          {/* Calculator */}
          <RevenueCalculator />

          {/* Social proof / context */}
          <div className="max-w-2xl mx-auto mt-16 grid sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: '~15%', label: 'Average broken-link rate on affiliate sites' },
              { stat: '$1,200', label: 'Average monthly revenue lost' },
              { stat: '< 24h', label: 'Time to detect issues with LinkRescue' },
            ].map((item) => (
              <div key={item.label} className="glass-card p-5">
                <div className="font-display text-3xl font-bold text-gradient mb-2">
                  {item.stat}
                </div>
                <p className="text-xs text-slate-400 leading-snug">{item.label}</p>
              </div>
            ))}
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
            <p>© {new Date().getFullYear()} LinkRescue</p>
          </div>
        </footer>
      </div>
    </>
  );
}
