export type OrgRole = 'viewer' | 'member' | 'admin' | 'owner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};
