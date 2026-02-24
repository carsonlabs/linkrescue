// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRevenueHistory(supabase: any, userId: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return supabase
    .from('revenue_history')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true });
}

export async function upsertRevenueHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  date: string, // YYYY-MM-DD
  lostCents: number,
  recoveredCents: number,
) {
  return supabase.from('revenue_history').upsert(
    {
      user_id: userId,
      date,
      total_revenue_lost_cents: lostCents,
      total_revenue_recovered_cents: recoveredCents,
    },
    { onConflict: 'user_id,date' },
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRevenueTotals(supabase: any, userId: string) {
  const { data } = await supabase
    .from('revenue_history')
    .select('total_revenue_lost_cents, total_revenue_recovered_cents')
    .eq('user_id', userId);

  let lostCents = 0;
  let recoveredCents = 0;
  for (const row of data ?? []) {
    lostCents += row.total_revenue_lost_cents;
    recoveredCents += row.total_revenue_recovered_cents;
  }
  return { lostCents, recoveredCents };
}
