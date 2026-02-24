import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { toCsv, csvResponse } from '@/lib/csv';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rules } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const headers = ['From URL', 'To URL', 'Status', 'Version', 'Created At'];
  const rows = (rules ?? []).map((r) => [r.from_url, r.to_url, r.status, r.version, r.created_at]);

  return csvResponse('redirect-rules.csv', toCsv(headers, rows));
}
