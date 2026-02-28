import { TIER_LIMITS, type TierName } from './tiers';

export interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
}

// Re-export TIER_LIMITS as PLAN_LIMITS for backward compatibility
export const PLAN_LIMITS = TIER_LIMITS;

export type PlanType = TierName;

// Stripe Price IDs - update these with your actual Stripe price IDs
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || '',
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  agency_monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID || process.env.STRIPE_AGENCY_PRICE_ID || '',
  agency_annual: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID || '',
};

export function getUserPlan(stripePriceId: string | null): PlanType {
  if (!stripePriceId) return 'free';
  if (
    stripePriceId === STRIPE_PRICE_IDS.agency_monthly ||
    stripePriceId === STRIPE_PRICE_IDS.agency_annual
  ) {
    return 'agency';
  }
  if (
    stripePriceId === STRIPE_PRICE_IDS.pro_monthly ||
    stripePriceId === STRIPE_PRICE_IDS.pro_annual
  ) {
    return 'pro';
  }
  // Fallback: any active price ID that isn't recognized is treated as pro
  return 'pro';
}

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}

export function isAnnualSubscription(stripePriceId: string | null): boolean {
  if (!stripePriceId) return false;
  return (
    stripePriceId === STRIPE_PRICE_IDS.pro_annual ||
    stripePriceId === STRIPE_PRICE_IDS.agency_annual
  );
}
