// Central tier configuration for LinkRescue
// ALL tier limits and feature flags live here. No hardcoded values elsewhere.

export const TIER_LIMITS = {
  free: {
    name: 'Starter',
    price: 0,
    annualPrice: 0,
    sites: 1,
    pagesPerScan: 200,
    scanFrequency: 'weekly' as const,
    manualScanCooldownSeconds: 0, // no manual scans
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
    features: ['basic_alerts', 'monthly_digest'] as readonly string[],
  },
  pro: {
    name: 'Pro',
    price: 29,
    annualPrice: 290, // 2 months free
    sites: 5,
    pagesPerScan: 2000,
    scanFrequency: 'daily' as const,
    manualScanCooldownSeconds: 3600, // 1 per hour
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
    features: [
      'basic_alerts',
      'weekly_digest',
      'revenue_estimates',
      'fix_suggestions',
      'on_demand_scans',
      'api_access',
    ] as readonly string[],
  },
  agency: {
    name: 'Agency',
    price: 79,
    annualPrice: 790, // 2 months free
    sites: 25,
    pagesPerScan: Infinity,
    scanFrequency: 'hourly' as const,
    manualScanCooldownSeconds: 900, // 1 per 15 minutes
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
    features: [
      'basic_alerts',
      'realtime_alerts',
      'revenue_estimates',
      'fix_suggestions',
      'api_access',
      'webhooks',
      'whitelabel_reports',
      'slack_integration',
      'priority_support',
      'on_demand_scans',
    ] as readonly string[],
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function hasFeature(tier: TierName, feature: string): boolean {
  return (TIER_LIMITS[tier].features as readonly string[]).includes(feature);
}

export function getTierLimits(tier: TierName) {
  return TIER_LIMITS[tier];
}

/** All feature keys used across tiers */
export type FeatureFlag =
  | 'basic_alerts'
  | 'monthly_digest'
  | 'weekly_digest'
  | 'revenue_estimates'
  | 'fix_suggestions'
  | 'realtime_alerts'
  | 'api_access'
  | 'webhooks'
  | 'whitelabel_reports'
  | 'slack_integration'
  | 'priority_support'
  | 'on_demand_scans';

export type ScanFrequencyType = 'hourly' | 'daily' | 'weekly' | 'monthly';
