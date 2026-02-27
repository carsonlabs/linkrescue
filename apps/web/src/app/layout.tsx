import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://www.linkrescue.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LinkRescue | Stop Losing Revenue to Broken Affiliate Links',
    template: '%s | LinkRescue',
  },
  description:
    'LinkRescue scans your site daily and alerts you the moment an affiliate link breaks, expires, or redirects incorrectly. Fix issues before they cost you commissions.',
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
    <html lang="en">
      <body className={inter.className}>
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
                'LinkRescue scans your site daily and alerts you the moment an affiliate link breaks, expires, or redirects incorrectly.',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '124',
              },
              offers: {
                '@type': 'Offer',
                price: '29.00',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
