import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const scanId = searchParams.get('scanId');

  let query = supabase
    .from('scan_results')
    .select(`
      id,
      issue_type,
      status_code,
      checked_at,
      links!inner(href, is_affiliate, pages!inner(url), sites!inner(user_id))
    `)
    .not('issue_type', 'eq', 'OK')
    .eq('links.sites.user_id', user.id);

  if (scanId) query = query.eq('scan_id', scanId);
  if (siteId) query = query.eq('links.site_id', siteId);

  const { data } = await query.limit(5000);

  const headers = ['Link', 'Found On Page', 'Issue Type', 'Status Code', 'Affiliate', 'Checked At'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).map((r) => {
    const link = r.links as { href: string; is_affiliate: boolean; pages: { url: string } };
    return [
      link.href,
      link.pages?.url ?? '',
      r.issue_type,
      r.status_code,
      link.is_affiliate ? 'Yes' : 'No',
      r.checked_at,
    ];
  });

  return csvResponse('broken-links.csv', toCsv(headers, rows));
}
