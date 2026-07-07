import type { IssueType } from '@linkrescue/types';

export interface CliOptions {
  json?: boolean;
  affiliateOnly?: boolean;
  verbose?: boolean;
  maxPages?: string;
  /** Soft time budget in seconds — scan self-terminates gracefully with partial results. */
  budget?: string;
}

export interface CheckedLink {
  pageUrl: string;
  href: string;
  statusCode: number | null;
  finalUrl: string | null;
  redirectHops: number;
  issueType: IssueType;
  isAffiliate: boolean;
}

export interface ScanReport {
  url: string;
  pagesScanned: number;
  totalLinks: number;
  results: CheckedLink[];
  durationMs: number;
  /** True when a time budget cut the scan short — results are partial. */
  budgetExhausted?: boolean;
  pagesSkippedBudget?: number;
  linksSkippedBudget?: number;
  /** Pages that needed the browser-profile fallback (site blocks declared crawlers). */
  pagesFetchedViaBrowserProfile?: number;
  /** True when any page required the browser fallback — published index stat. */
  blocksDeclaredCrawlers?: boolean;
  /** Pages that needed the headless tier (TLS-fingerprint bot wall). */
  pagesFetchedViaHeadless?: number;
  /** True when any page required the headless tier — "hard bot wall" index stat. */
  hardBotWall?: boolean;
}
