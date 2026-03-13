import type { IssueType } from '@linkrescue/types';

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
    domainsRateLimited: [],
    linksDelayedByDomainPacing: 0,
  };
}
