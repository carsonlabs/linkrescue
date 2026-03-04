import type { Metadata } from 'next';
import { RevenueCalculator } from '@/components/RevenueCalculator';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

const SITE_URL = 'https://www.linkrescue.io';
const PAGE_URL = `${SITE_URL}/affiliate-link-revenue-calculator`;

export const metadata: Metadata = {
  title: 'Attribution Failure Revenue Calculator | LinkRescue',
  description:
    'How much revenue are you losing to attribution failures? Calculate losses from broken links AND silent parameter stripping in Instagram, TikTok, and Safari.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Attribution Failure Revenue Calculator',
    description:
      'How much revenue are you losing to broken links and silent attribution failures?',
    url: PAGE_URL,
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attribution Failure Revenue Calculator',
    description:
      'How much revenue are you losing to broken links and silent attribution failures?',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Attribution Failure Revenue Calculator',
  url: PAGE_URL,
  description:
    'Calculate how much revenue your affiliate site loses to broken links, stripped tracking parameters, and silent attribution failures in social media browsers.',
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
        <PublicNav />

        {/* Page content */}
        <main className="container mx-auto px-6 pt-32 pb-24">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Free revenue calculator
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              How much revenue are you losing to{' '}
              <span className="text-gradient">attribution failures?</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Broken links are just the start. If your traffic comes from social media, in-app browsers
              are silently stripping your affiliate tags. See the full picture.
            </p>
          </div>

          {/* Calculator */}
          <RevenueCalculator />

          {/* Social proof / context */}
          <div className="max-w-2xl mx-auto mt-16 grid sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: '~15%', label: 'Average broken-link rate on affiliate sites' },
              { stat: '~40%', label: 'Of in-app browser clicks lose attribution' },
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

        <PublicFooter />
      </div>
    </>
  );
}
