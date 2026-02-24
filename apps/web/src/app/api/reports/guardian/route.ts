import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: linksRaw } = await supabase
    .from('guardian_links')
    .select('*, rescue_logs(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links = (linksRaw ?? []) as any[];

  const headers = ['Slug', 'Original URL', 'Backup URL', 'Status', 'Rescue Count', 'Value Saved ($)'];
  const rows = links.map((link) => {
    const rescues = Array.isArray(link.rescue_logs) ? link.rescue_logs.length : 0;
    const valueSaved = (rescues * link.value_per_click_cents) / 100;
    return [link.slug, link.original_url, link.backup_url, link.status, rescues, valueSaved.toFixed(2)];
  });

  return csvResponse('guardian-links.csv', toCsv(headers, rows));
}
