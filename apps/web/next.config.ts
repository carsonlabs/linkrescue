import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your existing Next.js config
  reactStrictMode: true,
  swcMinify: true,
  
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
