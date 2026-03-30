import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-base' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const siteUrl = 'https://www.linkrescue.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LinkRescue | Stop Losing Revenue to Broken Affiliate Links',
    template: '%s | LinkRescue',
  },
  description:
    'Scans your site daily for broken affiliate links, stripped tracking params, and silent attribution failures. Fix issues before they cost you commissions.',
  authors: [{ name: 'Carson Roell', url: 'https://freedomengineers.tech' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LinkRescue | Stop Losing Revenue to Broken Affiliate Links',
    description: 'Automated affiliate link monitoring for content creators.',
    url: siteUrl,
    siteName: 'LinkRescue',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkRescue | Stop Losing Revenue to Broken Affiliate Links',
    description: 'Automated affiliate link monitoring for content creators.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Rewardful affiliate tracking */}
        {process.env.NEXT_PUBLIC_REWARDFUL_API_KEY && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`,
              }}
            />
            <script
              async
              src="https://r.wdfl.co/rw.js"
              data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_API_KEY}
            />
          </>
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Toaster position="top-center" />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'LinkRescue',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Any',
              description:
                'Scans your site daily for broken affiliate links, stripped tracking params, and silent attribution failures.',
              author: {
                '@type': 'Person',
                name: 'Carson Roell',
                url: 'https://freedomengineers.tech',
              },
              datePublished: '2026-03-15',
              dateModified: '2026-03-30',
              offers: [
                { '@type': 'Offer', name: 'Starter', price: '0', priceCurrency: 'USD', description: '1 site, 200 pages/scan, weekly scans' },
                { '@type': 'Offer', name: 'Pro', price: '29.00', priceCurrency: 'USD', description: '5 sites, 2000 pages/scan, daily scans, API access' },
                { '@type': 'Offer', name: 'Agency', price: '79.00', priceCurrency: 'USD', description: '25 sites, unlimited pages, hourly scans, webhooks' },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is LinkRescue?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'LinkRescue is an automated affiliate link monitoring tool that crawls your content archive daily to find broken links, stripped tracking parameters, expired offers, and silent attribution failures that are costing you commissions.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does LinkRescue detect broken affiliate links?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'LinkRescue crawls your site via sitemap or page-by-page discovery, extracts all outbound links, and checks each one for HTTP errors (404, 500), redirect chains, missing tracking parameters, soft 404 pages, and content changes that indicate an expired or deprecated offer.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What does LinkRescue cost?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'LinkRescue has a free Starter tier (1 site, 200 pages, weekly scans), a Pro tier at $29/month (5 sites, 2000 pages, daily scans, API access), and an Agency tier at $79/month (25 sites, unlimited pages, hourly scans, webhooks, whitelabel reports).',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How much revenue am I losing to broken affiliate links?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Studies show that 5-15% of affiliate links break within 6 months due to program changes, URL updates, and merchant site redesigns. For a site earning $5,000/month in affiliate revenue, that could mean $250-$750/month in lost commissions from links you don\'t know are broken.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does LinkRescue have an API?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Pro and Agency plans include API access for programmatic link checking. There is also an npm SDK, a GitHub Action for CI/CD integration, and webhook support on the Agency tier for real-time notifications.',
                  },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
