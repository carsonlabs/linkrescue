import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('scanId');
  if (!scanId) return NextResponse.json({ error: 'Missing scanId' }, { status: 400 });

  const adminDb = createAdminClient();

  const { data: scan } = await adminDb
    .from('scans')
    .select('status, pages_scanned, links_checked')
    .eq('id', scanId)
    .single();

  if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let brokenCount = 0;
  let affiliateCount = 0;

  if (scan.status === 'completed') {
    const { count: broken } = await adminDb
      .from('scan_results')
      .select('*', { count: 'exact', head: true })
      .eq('scan_id', scanId)
      .not('issue_type', 'eq', 'OK');

    const { data: brokenAffiliate } = await adminDb
      .from('scan_results')
      .select('links!inner(is_affiliate)')
      .eq('scan_id', scanId)
      .not('issue_type', 'eq', 'OK')
      .eq('links.is_affiliate', true);

    brokenCount = broken ?? 0;
    affiliateCount = brokenAffiliate?.length ?? 0;
  }

  return NextResponse.json({
    status: scan.status,
    pagesScanned: scan.pages_scanned,
    linksChecked: scan.links_checked,
    brokenCount,
    affiliateCount,
  });
}
