export async function register() {
  // Validate environment variables on server startup
  if (process.env.NODE_ENV === 'production') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}
