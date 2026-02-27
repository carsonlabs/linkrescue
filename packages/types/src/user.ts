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
  free: {
    sites: 1,
    pagesPerScan: 200,
    guardianLinks: 3,
    offers: 10,
    redirectRules: 5,
    orgsOwned: 0,
    logSources: 0,
    webhooks: 0,
    aiMatchesPerScan: 0,
    apiReadRequestsPerHour: 0,
    apiScanRequestsPerDay: 0,
    monthlyCrawlPages: 0,
  },
  pro: {
    sites: 5,
    pagesPerScan: 500,
    guardianLinks: 100,
    offers: 500,
    redirectRules: 200,
    orgsOwned: 3,
    logSources: 5,
    webhooks: 10,
    aiMatchesPerScan: 50,
    apiReadRequestsPerHour: 100,
    apiScanRequestsPerDay: 2,
    monthlyCrawlPages: 10000,
  },
  agency: {
    sites: 25,
    pagesPerScan: 10000, // Effectively unlimited for most sites
    guardianLinks: 500,
    offers: 5000,
    redirectRules: 1000,
    orgsOwned: 10,
    logSources: 25,
    webhooks: 50,
    aiMatchesPerScan: 200,
    apiReadRequestsPerHour: 1000,
    apiScanRequestsPerDay: 10,
    monthlyCrawlPages: 100000,
  },
} as const;

export type PlanType = 'free' | 'pro' | 'agency';

// Stripe Price IDs - update these with your actual Stripe price IDs
export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || '',
};

export function getUserPlan(stripePriceId: string | null): PlanType {
  if (!stripePriceId) return 'free';
  if (stripePriceId === STRIPE_PRICE_IDS.agency) return 'agency';
  return 'pro';
}

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}
