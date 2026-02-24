import type { OrgRole, Database } from '@linkrescue/database';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Returns true if userId has at least minRole in the given org.
 */
export async function requireOrgRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  userId: string,
  minRole: OrgRole,
): Promise<boolean> {
  // Owner of the org always qualifies
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  if (org?.owner_id === userId) return true;

  const { data: memberData } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  const member = memberData as Database['public']['Tables']['org_members']['Row'] | null;

  if (!member) return false;
  return ROLE_HIERARCHY[member.role] >= ROLE_HIERARCHY[minRole];
}
