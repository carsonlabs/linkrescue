import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listIncidents } from '@linkrescue/database';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId') ?? undefined;
  const minHits = searchParams.get('minHits') ? parseInt(searchParams.get('minHits')!) : undefined;
  const statusCode = searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : undefined;

  const { data, error } = await listIncidents(supabase, user.id, { sourceId, minHits, statusCode });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
