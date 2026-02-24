import type { Database } from '../schema';

type Org = Database['public']['Tables']['organizations']['Row'];
type OrgInsert = Database['public']['Tables']['organizations']['Insert'];
type OrgMember = Database['public']['Tables']['org_members']['Row'];
type OrgMemberInsert = Database['public']['Tables']['org_members']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listUserOrgs(supabase: any, userId: string) {
  return supabase
    .from('organizations')
    .select('*, org_members!inner(role)')
    .or(`owner_id.eq.${userId},org_members.user_id.eq.${userId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOrgById(supabase: any, orgId: string) {
  return supabase.from('organizations').select('*').eq('id', orgId).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOrg(supabase: any, data: OrgInsert) {
  return supabase.from('organizations').insert(data).select().single();
}

export async function updateOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  data: Partial<Pick<Org, 'name' | 'slug'>>,
) {
  return supabase.from('organizations').update(data).eq('id', orgId).select().single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteOrg(supabase: any, orgId: string) {
  return supabase.from('organizations').delete().eq('id', orgId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listOrgMembers(supabase: any, orgId: string) {
  return supabase.from('org_members').select('*').eq('org_id', orgId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addOrgMember(supabase: any, data: OrgMemberInsert) {
  return supabase.from('org_members').insert(data).select().single();
}

export async function updateOrgMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  userId: string,
  data: Partial<Pick<OrgMember, 'role'>>,
) {
  return supabase
    .from('org_members')
    .update(data)
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .select()
    .single();
}

export async function removeOrgMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  userId: string,
) {
  return supabase.from('org_members').delete().eq('org_id', orgId).eq('user_id', userId);
}

export async function getOrgMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  userId: string,
) {
  return supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();
}

export async function countUserOrgs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId);
  return count ?? 0;
}
