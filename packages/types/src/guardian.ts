export type GuardianStatus = 'active' | 'paused' | 'broken';

export interface GuardianLink {
  id: string;
  user_id: string;
  org_id: string | null;
  slug: string;
  original_url: string;
  backup_url: string;
  status: GuardianStatus;
  value_per_click_cents: number;
  created_at: string;
  updated_at: string;
}

export interface RescueLog {
  id: string;
  guardian_link_id: string;
  visitor_ip_hash: string | null;
  rescued_at: string;
}

export interface GuardianAuditLog {
  id: string;
  guardian_link_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface GuardianFinancialSummary {
  totalRescues: number;
  totalValueCents: number;
  byLink: Array<{
    id: string;
    slug: string;
    rescues: number;
    valueCents: number;
  }>;
}
