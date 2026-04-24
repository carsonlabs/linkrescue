import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('curator_insights')
    .update({ dismissed_at: new Date().toISOString() } as any)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
