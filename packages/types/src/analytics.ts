export interface RevenueHistory {
  id: string;
  user_id: string;
  date: string; // DATE as ISO string YYYY-MM-DD
  total_revenue_lost_cents: number;
  total_revenue_recovered_cents: number;
}

export interface RecoveredSession {
  id: string;
  redirect_rule_id: string;
  session_fingerprint: string;
  converted: boolean;
  conversion_value_cents: number;
}

export interface ROISummary {
  revenueAtRiskCents: number;
  revenueRecoveredCents: number;
  recoveryRatePct: number;
  totalBrokenLinks: number;
  activeGuardianLinks: number;
  deployedRedirectRules: number;
}
