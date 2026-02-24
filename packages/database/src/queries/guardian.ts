import type { Database } from '../schema';

type GuardianLink = Database['public']['Tables']['guardian_links']['Row'];
type GuardianInsert = Database['public']['Tables']['guardian_links']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listGuardianLinks(supabase: any, userId: string) {
  return supabase.from('guardian_links').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGuardianLink(supabase: any, id: string) {
  return supabase.from('guardian_links').select('*').eq('id', id).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGuardianLinkBySlug(supabase: any, slug: string) {
  return supabase.from('guardian_links').select('*').eq('slug', slug).eq('status', 'active').single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createGuardianLink(supabase: any, data: GuardianInsert) {
  return supabase.from('guardian_links').insert(data).select().single();
}

export async function updateGuardianLink(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Partial<Omit<GuardianLink, 'id' | 'user_id' | 'created_at'>>,
) {
  return supabase
    .from('guardian_links')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteGuardianLink(supabase: any, id: string) {
  return supabase.from('guardian_links').delete().eq('id', id);
}

export async function countGuardianLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('guardian_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function logRescue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  guardianLinkId: string,
  visitorIpHash?: string,
) {
  return supabase
    .from('rescue_logs')
    .insert({ guardian_link_id: guardianLinkId, visitor_ip_hash: visitorIpHash ?? null });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFinancialSummary(supabase: any, userId: string) {
  const { data: links } = await supabase
    .from('guardian_links')
    .select('id, slug, value_per_click_cents')
    .eq('user_id', userId);

  if (!links || links.length === 0) {
    return { totalRescues: 0, totalValueCents: 0, byLink: [] };
  }

  const linkIds = links.map((l: { id: string }) => l.id);
  const { data: logs } = await supabase
    .from('rescue_logs')
    .select('guardian_link_id')
    .in('guardian_link_id', linkIds);

  const countByLink: Record<string, number> = {};
  for (const log of logs ?? []) {
    countByLink[log.guardian_link_id] = (countByLink[log.guardian_link_id] ?? 0) + 1;
  }

  let totalRescues = 0;
  let totalValueCents = 0;
  const byLink = links.map((l: { id: string; slug: string; value_per_click_cents: number }) => {
    const rescues = countByLink[l.id] ?? 0;
    const valueCents = rescues * l.value_per_click_cents;
    totalRescues += rescues;
    totalValueCents += valueCents;
    return { id: l.id, slug: l.slug, rescues, valueCents };
  });

  return { totalRescues, totalValueCents, byLink };
}
