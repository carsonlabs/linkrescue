// This file configures Sentry in the browser. Next.js loads it before client hydration.
import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    if (
      event.exception?.values?.[0]?.stacktrace?.frames?.some(
        (frame) =>
          frame.filename?.includes('chrome-extension') ||
          frame.filename?.includes('moz-extension'),
      )
    ) {
      return null;
    }

    return event;
  },
});
