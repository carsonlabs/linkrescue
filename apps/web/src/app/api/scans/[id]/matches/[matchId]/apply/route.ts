import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: Request,
  { params }: { params: { id: string; matchId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, scan_result_id, offer_id, scan_results!inner(scan_id, scans!inner(site_id, sites!inner(user_id)))')
    .eq('id', params.matchId)
    .single();

  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('matches')
    .update({ status: 'applied' })
    .eq('id', params.matchId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
