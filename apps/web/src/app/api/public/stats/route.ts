import { NextResponse } from 'next/server';
import { createAdminClient, getNetworkStatsPublic } from '@linkrescue/database';

/**
 * Public network stats — powers the homepage counter.
 * Cached for 1h at the edge so it stays cheap regardless of traffic.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const db = createAdminClient();
    const stats = await getNetworkStatsPublic(db);

    if (!stats) {
      return NextResponse.json(
        {
          protected_sites: 0,
          total_revenue_protected_cents: 0,
          total_issues_resolved: 0,
          total_issues_caught: 0,
          computed_at: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[/api/public/stats] error:', err);
    // Always return a sane shape so the homepage doesn't break
    return NextResponse.json(
      {
        protected_sites: 0,
        total_revenue_protected_cents: 0,
        total_issues_resolved: 0,
        total_issues_caught: 0,
        computed_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
