import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { createAdminClient } from '@linkrescue/database';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/scans/:scanId
 *
 * Returns scan status and results (when completed).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string } },
) {
  // Auth
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: CORS_HEADERS },
    );
  }

  const { scanId } = params;
  const adminDb = createAdminClient();

  // Fetch scan with site info
  const { data: scan, error: scanError } = await adminDb
    .from('scans')
    .select(`
      id,
      status,
      started_at,
      finished_at,
      pages_scanned,
      links_checked,
      scan_summary,
      site:sites!inner (
        id,
        domain,
        user_id
      )
    `)
    .eq('id', scanId)
    .maybeSingle();

  if (scanError || !scan) {
    return NextResponse.json(
      { error: 'Scan not found' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Verify ownership
  const site = scan.site as unknown as { id: string; domain: string; user_id: string };
  if (site.user_id !== auth.context.userId) {
    return NextResponse.json(
      { error: 'Scan not found' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Base response
  const response: Record<string, unknown> = {
    scan_id: scan.id,
    status: scan.status,
    domain: site.domain,
    started_at: scan.started_at,
    completed_at: scan.finished_at,
    pages_scanned: scan.pages_scanned,
    links_checked: scan.links_checked,
  };

  // Include summary if completed
  if (scan.status === 'completed' && scan.scan_summary) {
    response.summary = scan.scan_summary;
  }

  // Include broken links if completed
  if (scan.status === 'completed') {
    const { data: results } = await adminDb
      .from('scan_results')
      .select(`
        status_code,
        final_url,
        redirect_hops,
        issue_type,
        link:links!inner (
          href,
          is_affiliate
        )
      `)
      .eq('scan_id', scanId)
      .neq('issue_type', 'OK')
      .order('issue_type')
      .limit(500);

    if (results) {
      response.issues = results.map((r) => {
        const link = r.link as unknown as { href: string; is_affiliate: boolean };
        return {
          url: link.href,
          status_code: r.status_code,
          final_url: r.final_url,
          redirect_hops: r.redirect_hops,
          issue_type: r.issue_type,
          is_affiliate: link.is_affiliate,
        };
      });
      response.issue_count = response.issues ? (response.issues as unknown[]).length : 0;
    }
  }

  // Cache header — don't cache pending/running, cache completed for 5 min
  const cacheControl = scan.status === 'completed'
    ? 'public, max-age=300'
    : 'no-cache';

  return NextResponse.json(response, {
    status: 200,
    headers: { ...CORS_HEADERS, 'Cache-Control': cacheControl },
  });
}
