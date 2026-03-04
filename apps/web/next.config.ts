import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://r.wdfl.co https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://r.wdfl.co",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  transpilePackages: [
    '@linkrescue/database',
    '@linkrescue/crawler',
    '@linkrescue/email',
    '@linkrescue/types',
    '@linkrescue/ai',
    '@linkrescue/governance',
  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/calculator',
        destination: '/affiliate-link-revenue-calculator',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/sites/:path*', destination: '/dashboard/sites/:path*' },
      { source: '/analytics/:path*', destination: '/dashboard/analytics/:path*' },
      { source: '/guardian/:path*', destination: '/dashboard/guardian/:path*' },
      { source: '/offers/:path*', destination: '/dashboard/offers/:path*' },
      { source: '/orgs/:path*', destination: '/dashboard/orgs/:path*' },
      { source: '/redirect-rules/:path*', destination: '/dashboard/redirect-rules/:path*' },
      { source: '/reports/:path*', destination: '/dashboard/reports/:path*' },
      { source: '/script/:path*', destination: '/dashboard/script/:path*' },
      { source: '/settings/:path*', destination: '/dashboard/settings/:path*' },
      { source: '/monitoring/:path*', destination: '/dashboard/monitoring/:path*' },
      { source: '/sites', destination: '/dashboard/sites' },
      { source: '/analytics', destination: '/dashboard/analytics' },
      { source: '/guardian', destination: '/dashboard/guardian' },
      { source: '/offers', destination: '/dashboard/offers' },
      { source: '/orgs', destination: '/dashboard/orgs' },
      { source: '/redirect-rules', destination: '/dashboard/redirect-rules' },
      { source: '/reports', destination: '/dashboard/reports' },
      { source: '/script', destination: '/dashboard/script' },
      { source: '/settings', destination: '/dashboard/settings' },
      { source: '/monitoring', destination: '/dashboard/monitoring' },
    ];
  },

  // Sentry webpack plugin options
  sentry: {
    // Upload source maps to Sentry for better error tracking
    hideSourceMaps: true,

    // Automatically instrument Next.js data fetching methods
    autoInstrumentServerFunctions: true,

    // Disable Sentry in development
    disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
    disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  },
};

// Sentry webpack plugin options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin.
  // Keep this in sync with your sentry.properties file
  silent: true, // Suppresses all logs
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

// Make sure adding Sentry options is the last code to run before exporting
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
