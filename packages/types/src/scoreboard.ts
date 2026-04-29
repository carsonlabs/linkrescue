// ============================================================
// Scoreboard — pure types + value estimator
// No DB or runtime deps. Safe to import from any package.
// ============================================================

export type EstimatorTier = 'free' | 'pro' | 'agency';

export type IssueTypeKey =
  | 'OK'
  | 'BROKEN_4XX'
  | 'SERVER_5XX'
  | 'TIMEOUT'
  | 'REDIRECT_TO_HOME'
  | 'LOST_PARAMS'
  | 'SOFT_404'
  | 'CONTENT_CHANGED';

// Tier defaults reflect the rough monthly value of one broken affiliate
// link to a publisher at that scale:
//   Free   — $5/issue/mo  (hobbyist / first site)
//   Pro    — $10/issue/mo (working publisher)
//   Agency — $15/issue/mo (multi-site operator)
const TIER_BASE_VALUE_CENTS: Record<EstimatorTier, number> = {
  free: 500,
  pro: 1000,
  agency: 1500,
};

// Severity multipliers. Hard breaks lose 100% of the click;
// stripped params still convert but uncredited; content drift is partial.
const ISSUE_TYPE_MULTIPLIER: Record<IssueTypeKey, number> = {
  OK: 0,
  BROKEN_4XX: 1.0,
  SERVER_5XX: 1.0,
  SOFT_404: 0.9,
  REDIRECT_TO_HOME: 0.7,
  TIMEOUT: 0.6,
  LOST_PARAMS: 0.8,
  CONTENT_CHANGED: 0.4,
};

const AFFILIATE_BONUS = 1.25;

export interface EstimateValueArgs {
  tier: EstimatorTier;
  issueType: IssueTypeKey;
  isAffiliate?: boolean;
}

/** Estimate monthly commission $ at risk for one issue, in cents. */
export function estimateValueCents(args: EstimateValueArgs): number {
  const { tier, issueType, isAffiliate = false } = args;
  if (issueType === 'OK') return 0;

  const base = TIER_BASE_VALUE_CENTS[tier];
  const issueMult = ISSUE_TYPE_MULTIPLIER[issueType] ?? 0.5;
  const affiliateMult = isAffiliate ? AFFILIATE_BONUS : 1.0;

  return Math.round(base * issueMult * affiliateMult);
}

// ============================================================
// Scoreboard data shape (read from public.user_scoreboard view)
// ============================================================

export interface UserScoreboard {
  user_id: string;
  issues_caught_this_month: number;
  issues_resolved_this_month: number;
  revenue_at_risk_cents: number;
  revenue_protected_cents: number;
  revenue_protected_last_month_cents: number;
  issues_resolved_all_time: number;
  revenue_protected_all_time_cents: number;
  avg_health_score_7d: number | null;
  top_at_risk_program: string | null;
  top_program_issue_count: number;
}

export interface NetworkStatsPublic {
  protected_sites: number;
  total_issues_resolved: number;
  total_revenue_protected_cents: number;
  total_issues_caught: number;
  computed_at: string;
}

// ============================================================
// Formatters
// ============================================================

/** 342050 → "$3,420.50" */
export function formatCents(cents: number | null | undefined): string {
  const v = cents ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v / 100);
}

/** 342050 → "$3.4K" */
export function formatCentsCompact(cents: number | null | undefined): string {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);
}

/** 342050 → "$3,420" (no cents — used in big hero displays) */
export function formatCentsWhole(cents: number | null | undefined): string {
  const v = cents ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v / 100);
}

export interface MoMDelta {
  sign: 'up' | 'down' | 'flat';
  pct: number;
  absCents: number;
}

/** Month-over-month delta. Returns null if there's no comparable history. */
export function monthOverMonthDelta(
  thisMonthCents: number,
  lastMonthCents: number
): MoMDelta | null {
  if (lastMonthCents === 0 && thisMonthCents === 0) return null;
  const absCents = thisMonthCents - lastMonthCents;
  if (lastMonthCents === 0) {
    return { sign: 'up', pct: 100, absCents };
  }
  const pct = Math.round(((thisMonthCents - lastMonthCents) / lastMonthCents) * 100);
  return {
    sign: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
    pct: Math.abs(pct),
    absCents,
  };
}
