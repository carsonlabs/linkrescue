import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: scan } = await supabase
    .from('scans')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', params.id)
    .single();

  if (!scan || (scan.sites as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*, offers(*), scan_results!inner(scan_id, links(href))')
    .eq('scan_results.scan_id', params.id)
    .order('match_score', { ascending: false });

  return NextResponse.json(matches ?? []);
}
