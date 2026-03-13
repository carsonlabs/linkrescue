import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';

/**
 * Retention cleanup cron.
 *
 * Deletes scan-related data older than 90 days to keep the database lean.
 * Runs weekly via Vercel Cron.
 *
 * What gets cleaned:
 * - scan_events (log noise) older than 90 days
 * - scan_results for scans older than 90 days
 * - scans older than 90 days (cascades handle scan_results/scan_events via FK)
 *
 * Pages and links are NOT deleted — they're the persistent asset inventory.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Delete scan_events first (no FK cascade from scans to events in some setups)
  const { count: eventsDeleted } = await supabase
    .from('scan_events')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);

  // Delete old scans — scan_results cascade via FK ON DELETE CASCADE
  const { count: scansDeleted } = await supabase
    .from('scans')
    .delete({ count: 'exact' })
    .lt('finished_at', cutoff)
    .in('status', ['completed', 'failed']);

  return NextResponse.json({
    message: 'Retention cleanup complete',
    cutoff,
    eventsDeleted: eventsDeleted ?? 0,
    scansDeleted: scansDeleted ?? 0,
  });
}
