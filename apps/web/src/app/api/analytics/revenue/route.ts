import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRevenueHistory, getRevenueTotals } from '@linkrescue/database';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: history }, totals] = await Promise.all([
    getRevenueHistory(supabase, user.id, 90),
    getRevenueTotals(supabase, user.id),
  ]);

  return NextResponse.json({ history: history ?? [], totals });
}
