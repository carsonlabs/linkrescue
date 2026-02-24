import type { Database, RedirectStatus } from '../schema';

type RedirectRule = Database['public']['Tables']['redirect_rules']['Row'];
type RedirectInsert = Database['public']['Tables']['redirect_rules']['Insert'];
type VersionInsert = Database['public']['Tables']['redirect_rule_versions']['Insert'];
type ApprovalInsert = Database['public']['Tables']['approval_log']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listRedirectRules(supabase: any, userId: string) {
  return supabase
    .from('redirect_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRedirectRule(supabase: any, id: string) {
  return supabase.from('redirect_rules').select('*').eq('id', id).single();
}

export async function createRedirectRule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  data: RedirectInsert,
) {
  return supabase.from('redirect_rules').insert(data).select().single();
}

export async function updateRedirectRule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Partial<Omit<RedirectRule, 'id' | 'user_id' | 'created_at'>>,
) {
  return supabase
    .from('redirect_rules')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDeployedRules(supabase: any, userId: string) {
  return supabase
    .from('redirect_rules')
    .select('from_url, to_url')
    .eq('user_id', userId)
    .eq('status', 'deployed');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAllDeployedRules(supabase: any) {
  return supabase
    .from('redirect_rules')
    .select('from_url, to_url')
    .eq('status', 'deployed');
}

export async function createRuleVersion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  data: VersionInsert,
) {
  return supabase.from('redirect_rule_versions').insert(data).select().single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listRuleVersions(supabase: any, ruleId: string) {
  return supabase
    .from('redirect_rule_versions')
    .select('*')
    .eq('rule_id', ruleId)
    .order('version', { ascending: false });
}

export async function createApprovalLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  data: ApprovalInsert,
) {
  return supabase.from('approval_log').insert(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listApprovalLog(supabase: any, ruleId: string) {
  return supabase
    .from('approval_log')
    .select('*')
    .eq('rule_id', ruleId)
    .order('acted_at', { ascending: false });
}

export async function countRedirectRules(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('redirect_rules')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}
