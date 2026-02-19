export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
}

export const PLAN_LIMITS = {
  free: { sites: 1, pagesPerScan: 50 },
  pro: { sites: 5, pagesPerScan: 500 },
} as const;

export type PlanType = 'free' | 'pro';

export function getUserPlan(stripePriceId: string | null): PlanType {
  if (!stripePriceId) return 'free';
  return 'pro';
}

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}
