import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify site ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // Get latest scan for this site
  const { data: scan } = await supabase
    .from('scans')
    .select('id, status, pages_scanned, links_checked, started_at, finished_at, error_message, created_at')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan) {
    return NextResponse.json({ scan: null });
  }

  // If scan is running, count scan_results so far for live progress
  let linksCheckedSoFar = scan.links_checked;
  if (scan.status === 'running') {
    const { count } = await supabase
      .from('scan_results')
      .select('*', { count: 'exact', head: true })
      .eq('scan_id', scan.id);
    linksCheckedSoFar = count ?? 0;
  }

  return NextResponse.json({
    scan: {
      id: scan.id,
      status: scan.status,
      pagesScanned: scan.pages_scanned,
      linksChecked: scan.status === 'running' ? linksCheckedSoFar : scan.links_checked,
      startedAt: scan.started_at,
      finishedAt: scan.finished_at,
      error: scan.error_message,
      createdAt: scan.created_at,
    },
  });
}
