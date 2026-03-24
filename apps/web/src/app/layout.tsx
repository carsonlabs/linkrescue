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
                'LinkRescue scans your site daily and alerts you the moment an affiliate link breaks, expires, or redirects incorrectly.',
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
