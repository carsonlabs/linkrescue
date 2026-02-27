import { NextResponse } from 'next/server';

// Force dynamic rendering - don't pre-render this route
export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify Sentry is working
 * Trigger this endpoint to generate a test error
 */
export async function GET() {
  // This will intentionally throw an error to test Sentry
  throw new Error('🧪 Sentry Test Error - This is intentional!');
}
