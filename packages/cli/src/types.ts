import type { IssueType } from '@linkrescue/types';

export interface CliOptions {
  json?: boolean;
  affiliateOnly?: boolean;
  verbose?: boolean;
  maxPages?: string;
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
}
