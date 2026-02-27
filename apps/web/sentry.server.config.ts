// This file configures the initialization of Sentry on the server.
// The config you add here will be used when the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Filter out health check endpoints to reduce noise
  beforeSend(event) {
    // Filter out health check requests
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    return event;
  },
});
