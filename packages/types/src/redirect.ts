export type RedirectStatus = 'draft' | 'pending_approval' | 'approved' | 'deployed' | 'archived';

export interface RedirectRule {
  id: string;
  user_id: string;
  org_id: string | null;
  from_url: string;
  to_url: string;
  status: RedirectStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RedirectRuleVersion {
  id: string;
  rule_id: string;
  from_url: string;
  to_url: string;
  status: RedirectStatus;
  version: number;
  changed_by: string;
  changed_at: string;
}

export interface ApprovalLog {
  id: string;
  rule_id: string;
  action: string;
  actor_id: string;
  note: string | null;
  acted_at: string;
}

export interface RuleEdge {
  from_url: string;
  to_url: string;
}
