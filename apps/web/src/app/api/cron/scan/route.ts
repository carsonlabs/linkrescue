import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runScan } from '@linkrescue/crawler';

// This endpoint is triggered by Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient();

  // 1. Get all verified sites
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('ownership_verified', true);

  if (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  // 2. Trigger a scan for each site
  // In production, this should be a background job system (e.g., Inngest, Vercel Functions)
  // For MVP, we run them sequentially with a timeout.
  for (const site of sites) {
    try {
      // We don't await this to avoid Vercel function timeouts
      // This is NOT robust. A real queue is needed for production.
      runScan(site as any);
    } catch (scanError) {
      console.error(`Failed to scan site ${site.domain}:`, scanError);
    }
  }

  return NextResponse.json({ message: `Triggered scans for ${sites.length} sites.` });
}
