import type { IssueType, EstimatorTier } from '@linkrescue/types';

export interface ExtractedLink {
  href: string;
  isAffiliate: boolean;
}

export interface PageLinks {
  pageUrl: string;
  links: ExtractedLink[];
}

export interface LinkCheckResult {
  href: string;
  statusCode: number | null;
  finalUrl: string | null;
  redirectHops: number;
  issueType: IssueType;
  isAffiliate: boolean;
}

export interface ScanOptions {
  /** Pre-created scan ID. If provided, runScan uses this instead of inserting a new row. */
  scanId?: string;
  siteId: string;
  domain: string;
  sitemapUrl: string | null;
  maxPages: number;
  crawlExclusions?: string[];
  /**
   * User's plan tier — drives the per-issue value estimate written to scan_results.
   * Defaults to 'free' (most conservative) when not provided.
   */
  userTier?: EstimatorTier;
  /**
   * Soft wall-clock budget for the whole scan. When exceeded, the scan stops
   * starting new work and finalizes gracefully with partial results
   * (summary.budgetExhausted = true). Set this BELOW the hosting platform's
   * hard kill limit (e.g. Vercel maxDuration) so scans always finish their
   * writes instead of dying mid-flight. Unset = unlimited.
   */
  maxDurationMs?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}

/** Structured operational counters persisted as scan_summary JSONB. */
export interface ScanSummary {
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** Pages discovered before filtering. */
  pagesDiscovered: number;
  /** Pages actually fetched (after SSRF/robots/exclusion filtering). */
  pagesFetched: number;
  /** Pages skipped by robots.txt. */
  pagesSkippedRobots: number;
  /** Pages skipped by customer crawl exclusions. */
  pagesSkippedExclusions: number;
  /** Pages skipped by SSRF check. */
  pagesSkippedSsrf: number;
  /** Pages that failed to fetch (non-ok response). */
  pagesFailedFetch: number;
  /** Total outbound links found. */
  linksFound: number;
  /** Links that required at least one retry. */
  linksRetried: number;
  /** Links that timed out (after retries). */
  linksTimedOut: number;
  /** Links blocked by SSRF check. */
  linksBlockedSsrf: number;
  /** Links bot-blocked by the destination (403/405/429 after GET retry) — persisted as OK, counted here. */
  linksBotBlocked: number;
  /** True when maxDurationMs cut the scan short — results are partial. */
  budgetExhausted: boolean;
  /** Domains that returned 429 (rate limit) during link checks. */
  domainsRateLimited: string[];
  /** Count of links delayed by per-domain pacing. */
  linksDelayedByDomainPacing: number;
}

/** Creates a zeroed-out ScanSummary. */
export function createScanSummary(): ScanSummary {
  return {
    durationMs: 0,
    pagesDiscovered: 0,
    pagesFetched: 0,
    pagesSkippedRobots: 0,
    pagesSkippedExclusions: 0,
    pagesSkippedSsrf: 0,
    pagesFailedFetch: 0,
    linksFound: 0,
    linksRetried: 0,
    linksTimedOut: 0,
    linksBlockedSsrf: 0,
    linksBotBlocked: 0,
    budgetExhausted: false,
    domainsRateLimited: [],
    linksDelayedByDomainPacing: 0,
  };
}
