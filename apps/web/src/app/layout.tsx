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
    default: 'LinkRescue | Affiliate Link Recovery',
    template: '%s | LinkRescue',
  },
  description:
    'A service-led recovery workflow for affiliate publishers: scoped link checks, practical fixes, and managed monitoring after readiness review.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LinkRescue | Affiliate Link Recovery',
    description: 'Scoped link checks and recovery support for affiliate publishers.',
    url: siteUrl,
    siteName: 'LinkRescue',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkRescue | Affiliate Link Recovery',
    description: 'Scoped link checks and recovery support for affiliate publishers.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
                'A service-led affiliate link recovery workflow for finding and prioritizing broken links and tracking failures.',
              dateModified: '2026-08-12',
            }),
          }}
        />
      </body>
    </html>
  );
}
