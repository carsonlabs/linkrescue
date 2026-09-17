import { CRAWLER_USER_AGENT, PAGE_FETCH_TIMEOUT_MS } from './crawl-config';
import { crawlSite } from './crawl';
import { discoverPages } from './sitemap';
import { extractOutboundLinks } from './link-extractor';
import { extractTextContent } from './content-hash';
import { fetchWithCrawlerFallback, resetCrawlerFallbackMemory } from './browser-fetch';
import { clearRobotsCache, getRobotsRules, isPathAllowed } from './robots';
import { validateFetchUrlWithDns } from './url-safety';

export const QUALIFICATION_DEFAULTS = {
  maxProbePages: 10,
  maxDiscoveryPages: 200,
  maxDurationMs: 10 * 60 * 1000,
  minimumArchivePages: 30,
  minimumAffiliateLinks: 50,
  minimumWordsPerPage: 150,
} as const;

export type QualificationDecision = 'PASS' | 'FAIL';
export type QualificationRoute = 'start_sprint' | 'manual_review' | 'decline';

export interface QualificationEvidence {
  target: string;
  discoveryMethod: 'sitemap' | 'crawl';
  discoveredUrls: number;
  archivePageCandidates: number;
  robotsAllowedCandidates: number;
  probePagesAttempted: number;
  pagesFetched: number;
  substantivePagesSampled: number;
  outboundLinkOccurrences: number;
  affiliateLinkOccurrences: number;
  uniqueAffiliateLinks: number;
  pagesFetchedViaBrowserProfile: number;
  pagesFetchedViaHeadless: number;
  botBlockedPages: number;
  failedPages: number;
  budgetExhausted: boolean;
  durationMs: number;
}

export interface QualificationResult {
  decision: QualificationDecision;
  route: QualificationRoute;
  reasons: string[];
  evidence: QualificationEvidence;
  thresholds: {
    minimumArchivePages: number;
    minimumAffiliateLinks: number;
    maxProbePages: number;
  };
}

export interface QualificationOptions {
  maxProbePages?: number;
  maxDiscoveryPages?: number;
  maxDurationMs?: number;
  sitemapUrl?: string | null;
}

const NON_CONTENT_PATHS = [
  /^\/$/,
  /^\/(about|contact|privacy|terms|login|signup|account|cart|checkout)(\/|$)/i,
  /^\/(author|authors|tag|tags|category|categories|search|feed)(\/|$)/i,
  /^\/(wp-admin|wp-json|api)(\/|$)/i,
];

const NON_HTML_EXTENSIONS =
  /\.(?:avif|css|csv|gif|ico|jpe?g|js|json|mp3|mp4|pdf|png|svg|txt|webm|webp|xml|zip)$/i;

/**
 * Cheap URL-level filter used only to estimate whether the public archive is
 * large enough to justify a fixed-scope Sprint. It is deliberately labelled
 * "candidate": the ten-page content sample supplies the second half of the
 * evidence and the command never presents this as a verified page count.
 */
export function isArchivePageCandidate(rawUrl: string, domain: string): boolean {
  if (!isProbePageCandidate(rawUrl, domain)) return false;
  try {
    const url = new URL(rawUrl);
    return !NON_CONTENT_PATHS.some((pattern) => pattern.test(url.pathname));
  } catch {
    return false;
  }
}

/**
 * Pure margin gate. PASS means the public evidence supports starting the
 * fixed-scope Sprint. Every FAIL includes a route so crawler friction is sent
 * to a human conversation rather than misrepresented as a clean site.
 */
export function evaluateQualification(
  evidence: QualificationEvidence,
  thresholds: QualificationResult['thresholds'] = {
    minimumArchivePages: QUALIFICATION_DEFAULTS.minimumArchivePages,
    minimumAffiliateLinks: QUALIFICATION_DEFAULTS.minimumAffiliateLinks,
    maxProbePages: QUALIFICATION_DEFAULTS.maxProbePages,
  }
): Omit<QualificationResult, 'evidence' | 'thresholds'> {
  const reasons: string[] = [];
  const expectedProbePages = Math.min(thresholds.maxProbePages, evidence.robotsAllowedCandidates);
  const eligibleArchivePages = Math.min(
    evidence.archivePageCandidates,
    evidence.robotsAllowedCandidates
  );
  const minimumUsefulFetches = Math.ceil(expectedProbePages * 0.8);

  if (evidence.budgetExhausted) {
    reasons.push('The probe hit its time budget before coverage was reliable.');
  }
  if (
    evidence.botBlockedPages > 0 ||
    evidence.pagesFetchedViaBrowserProfile > 0 ||
    evidence.pagesFetchedViaHeadless > 0
  ) {
    reasons.push('Automation blocking requires a human coverage decision.');
  }
  if (expectedProbePages === 0) {
    reasons.push('Discovery and robots.txt produced no public HTML pages that could be sampled.');
  } else if (evidence.pagesFetched < minimumUsefulFetches) {
    reasons.push(
      `Only ${evidence.pagesFetched}/${expectedProbePages} sampled pages returned usable HTML.`
    );
  }
  if (
    evidence.discoveryMethod !== 'sitemap' &&
    evidence.archivePageCandidates < thresholds.minimumArchivePages
  ) {
    reasons.push('No sitemap proved the archive-size threshold.');
  }

  if (reasons.length > 0) {
    return { decision: 'FAIL', route: 'manual_review', reasons };
  }

  if (eligibleArchivePages < thresholds.minimumArchivePages) {
    reasons.push(
      `${eligibleArchivePages} robots-allowed content-page candidates is below the ${thresholds.minimumArchivePages}-page gate.`
    );
  }
  if (evidence.affiliateLinkOccurrences < thresholds.minimumAffiliateLinks) {
    reasons.push(
      `${evidence.affiliateLinkOccurrences} affiliate-link occurrences is below the ${thresholds.minimumAffiliateLinks}-link gate.`
    );
  }
  const minimumSubstantiveSample = Math.max(1, Math.ceil(evidence.pagesFetched * 0.6));
  if (evidence.substantivePagesSampled < minimumSubstantiveSample) {
    reasons.push(
      `Only ${evidence.substantivePagesSampled}/${evidence.pagesFetched} sampled pages were substantive.`
    );
  }

  if (reasons.length > 0) {
    return { decision: 'FAIL', route: 'decline', reasons };
  }

  return {
    decision: 'PASS',
    route: 'start_sprint',
    reasons: [
      `Public evidence clears the ${thresholds.minimumArchivePages}-page and ${thresholds.minimumAffiliateLinks}-affiliate-link gates.`,
    ],
  };
}

/**
 * Run the standing ten-page qualification probe without creating database
 * records or checking destination links. It reads public pages only, respects
 * robots.txt, and stops at the configured wall-clock deadline.
 */
export async function qualifySite(
  rawTarget: string,
  options: QualificationOptions = {}
): Promise<QualificationResult> {
  const startTime = Date.now();
  const maxProbePages = clampPositive(
    options.maxProbePages,
    QUALIFICATION_DEFAULTS.maxProbePages,
    QUALIFICATION_DEFAULTS.maxProbePages
  );
  const maxDiscoveryPages = clampPositive(
    options.maxDiscoveryPages,
    QUALIFICATION_DEFAULTS.maxDiscoveryPages,
    QUALIFICATION_DEFAULTS.maxDiscoveryPages
  );
  const maxDurationMs = clampPositive(
    options.maxDurationMs,
    QUALIFICATION_DEFAULTS.maxDurationMs,
    QUALIFICATION_DEFAULTS.maxDurationMs
  );
  const deadline = startTime + maxDurationMs;

  const normalizedTarget = /^https?:\/\//i.test(rawTarget) ? rawTarget : `https://${rawTarget}`;
  const target = await validateFetchUrlWithDns(normalizedTarget);
  if (!target) {
    throw new Error('Target must be a public http(s) URL.');
  }

  const domain = target.hostname.toLowerCase();
  const origin = target.origin;
  clearRobotsCache();
  resetCrawlerFallbackMemory();

  const robotsRules = await getRobotsRules(origin);
  const discoveryDeadline = Math.min(deadline, startTime + Math.floor(maxDurationMs * 0.3));
  let discoveryMethod: QualificationEvidence['discoveryMethod'] = 'sitemap';
  let discoveredUrls = await discoverPages(
    domain,
    options.sitemapUrl ?? null,
    maxDiscoveryPages,
    discoveryDeadline
  );
  let pagesFetchedViaBrowserProfile = 0;
  let pagesFetchedViaHeadless = 0;

  if (discoveredUrls.length === 0 && Date.now() <= deadline) {
    discoveryMethod = 'crawl';
    discoveredUrls = await crawlSite(domain, 2, maxProbePages, deadline, (tier) => {
      if (tier === 'browser') pagesFetchedViaBrowserProfile++;
      else pagesFetchedViaHeadless++;
    });
  }

  const uniqueDiscovered = Array.from(new Set(discoveredUrls));
  const probeCandidates = uniqueDiscovered.filter((url) => isProbePageCandidate(url, domain));
  const robotsAllowed = probeCandidates.filter((rawUrl) => {
    try {
      return isPathAllowed(robotsRules, new URL(rawUrl).pathname);
    } catch {
      return false;
    }
  });
  const archiveCandidates = robotsAllowed.filter((url) => isArchivePageCandidate(url, domain));

  const sampledUrls = sampleEvenly(robotsAllowed, maxProbePages);
  let pagesFetched = 0;
  let substantivePagesSampled = 0;
  let outboundLinkOccurrences = 0;
  let affiliateLinkOccurrences = 0;
  let botBlockedPages = 0;
  let failedPages = 0;
  const uniqueAffiliateLinks = new Set<string>();
  let attempted = 0;

  for (const pageUrl of sampledUrls) {
    if (Date.now() > deadline) break;
    attempted++;
    try {
      const remainingMs = Math.max(1, deadline - Date.now());
      const { response, usedBrowserFallback, usedHeadlessFallback } =
        await fetchWithCrawlerFallback(pageUrl, {
          timeoutMs: Math.min(PAGE_FETCH_TIMEOUT_MS, remainingMs),
          honestUserAgent: CRAWLER_USER_AGENT,
        });
      if (usedBrowserFallback) pagesFetchedViaBrowserProfile++;
      if (usedHeadlessFallback) pagesFetchedViaHeadless++;

      if ([401, 403, 405, 429].includes(response.status)) {
        botBlockedPages++;
      }
      if (!response.ok) {
        failedPages++;
        continue;
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) {
        failedPages++;
        continue;
      }

      const html = await response.text();
      pagesFetched++;
      const wordCount = extractTextContent(html).split(/\s+/).filter(Boolean).length;
      if (wordCount >= QUALIFICATION_DEFAULTS.minimumWordsPerPage) {
        substantivePagesSampled++;
      }

      const links = extractOutboundLinks(html, domain);
      const affiliateLinks = links.filter((link) => link.isAffiliate);
      outboundLinkOccurrences += links.length;
      affiliateLinkOccurrences += affiliateLinks.length;
      for (const link of affiliateLinks) uniqueAffiliateLinks.add(link.href);
    } catch {
      failedPages++;
    }
  }

  const evidence: QualificationEvidence = {
    target: target.toString(),
    discoveryMethod,
    discoveredUrls: uniqueDiscovered.length,
    archivePageCandidates: archiveCandidates.length,
    robotsAllowedCandidates: robotsAllowed.length,
    probePagesAttempted: attempted,
    pagesFetched,
    substantivePagesSampled,
    outboundLinkOccurrences,
    affiliateLinkOccurrences,
    uniqueAffiliateLinks: uniqueAffiliateLinks.size,
    pagesFetchedViaBrowserProfile,
    pagesFetchedViaHeadless,
    botBlockedPages,
    failedPages,
    budgetExhausted: attempted < sampledUrls.length || Date.now() > deadline,
    durationMs: Date.now() - startTime,
  };
  const thresholds = {
    minimumArchivePages: QUALIFICATION_DEFAULTS.minimumArchivePages,
    minimumAffiliateLinks: QUALIFICATION_DEFAULTS.minimumAffiliateLinks,
    maxProbePages,
  };

  return {
    ...evaluateQualification(evidence, thresholds),
    evidence,
    thresholds,
  };
}

function sampleEvenly<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  if (limit === 1) return [items[0]];

  const sampled: T[] = [];
  for (let index = 0; index < limit; index++) {
    const sourceIndex = Math.round((index * (items.length - 1)) / (limit - 1));
    sampled.push(items[sourceIndex]);
  }
  return sampled;
}

function isProbePageCandidate(rawUrl: string, domain: string): boolean {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    const normalizedDomain = domain.toLowerCase();
    if (hostname !== normalizedDomain && !hostname.endsWith(`.${normalizedDomain}`)) {
      return false;
    }
    return !NON_HTML_EXTENSIONS.test(url.pathname);
  } catch {
    return false;
  }
}

function clampPositive(value: number | undefined, fallback: number, maximum: number): number {
  if (!value || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.floor(value), maximum);
}
