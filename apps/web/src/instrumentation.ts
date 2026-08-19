export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }

  // Validate environment variables on server startup
  if (process.env.NODE_ENV === 'production') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}
