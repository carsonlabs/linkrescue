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
  siteId: string;
  domain: string;
  sitemapUrl: string | null;
  maxPages: number;
  supabase: import('@supabase/supabase-js').SupabaseClient;
}
