import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for uptime monitoring (Better Stack, UptimeRobot, etc.)
 * Returns 200 if all systems are operational
 * Returns 503 if any critical service is down
 */
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    services: {
      web: 'ok',
      database: 'unknown',
    },
  };

  let statusCode = 200;

  try {
    // Check database connectivity
    const supabase = createClient();
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    
    if (error) {
      checks.services.database = 'error';
      checks.status = 'degraded';
      statusCode = 503;
    } else {
      checks.services.database = 'ok';
    }
  } catch (err) {
    checks.services.database = 'error';
    checks.status = 'degraded';
    statusCode = 503;
  }

  return NextResponse.json(checks, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
