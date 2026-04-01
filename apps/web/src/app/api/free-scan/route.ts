import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';
import { crawlSite, extractOutboundLinks, checkLink, isAffiliateLink } from '@linkrescue/crawler';

export const maxDuration = 120; // 2 minutes max for Vercel

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FreeScanPayload {
  url: string;
  email: string;
}

interface BrokenLinkDetail {
  href: string;
  statusCode: number | null;
  isAffiliate: boolean;
  issueType: string;
  foundOnPage: string;
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory)                                           */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // 3 free scans per hour per IP
const RATE_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ------------------------------------------------------------------ */
/*  Revenue loss estimation                                            */
/* ------------------------------------------------------------------ */

/**
 * Conservative revenue loss estimate based on broken affiliate links.
 * Uses industry average: $2-8 per broken affiliate link per month.
 * We use $4.50 as a middle estimate to be credible.
 */
function estimateMonthlyLoss(brokenAffiliateCount: number): number {
  const PER_LINK_MONTHLY_LOSS = 4.5;
  return Math.round(brokenAffiliateCount * PER_LINK_MONTHLY_LOSS * 100) / 100;
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractDomain(rawUrl: string): string | null {
  let urlStr = rawUrl.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'You have reached the free scan limit. Create a free account for unlimited scans.' },
      { status: 429 }
    );
  }

  let body: FreeScanPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url: rawUrl, email } = body;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const domain = extractDomain(rawUrl);
  if (!domain) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  const MAX_PAGES = 20;

  try {
    // 1. Crawl the site to discover pages (up to 20)
    const pageUrls = await crawlSite(domain, 2, MAX_PAGES);

    if (pageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Could not reach the site or no pages found. Please check the URL and try again.' },
        { status: 422 }
      );
    }

    // 2. For each page, fetch HTML and extract+check outbound links
    const allBrokenLinks: BrokenLinkDetail[] = [];
    let totalLinksChecked = 0;
    let totalAffiliateLinks = 0;

    for (const pageUrl of pageUrls) {
      try {
        const response = await fetch(pageUrl, {
          signal: AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'LinkRescue-FreeScan/1.0 (+https://linkrescue.io)' },
        });

        if (!response.ok) continue;
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) continue;

        const html = await response.text();
        const outboundLinks = extractOutboundLinks(html, domain);

        for (const extLink of outboundLinks) {
          totalLinksChecked++;
          const linkIsAffiliate = isAffiliateLink(extLink.href);
          if (linkIsAffiliate) totalAffiliateLinks++;

          const result = await checkLink(extLink);

          if (result.issueType !== 'OK') {
            allBrokenLinks.push({
              href: result.href,
              statusCode: result.statusCode,
              isAffiliate: linkIsAffiliate,
              issueType: result.issueType,
              foundOnPage: pageUrl,
            });
          }
        }
      } catch {
        // Skip pages that fail to fetch
      }
    }

    const brokenAffiliateCount = allBrokenLinks.filter((l) => l.isAffiliate).length;
    const estimatedLoss = estimateMonthlyLoss(brokenAffiliateCount);

    // 3. Save lead to database
    try {
      const db = createAdminClient();
      // Using type cast because free_scan_leads isn't in generated types yet
      await (db.from as Function)('free_scan_leads').insert({
        email: email.toLowerCase().trim(),
        site_url: rawUrl.trim(),
        source: 'free-scan',
        broken_links_count: allBrokenLinks.length,
        affiliate_issues_count: brokenAffiliateCount,
        estimated_loss: estimatedLoss,
        scanned_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[free-scan] DB insert failed:', err);
      // Don't fail the scan — still return results
    }

    // 4. Return results (client will gate the full list)
    return NextResponse.json({
      domain,
      pagesScanned: pageUrls.length,
      totalLinksChecked,
      totalAffiliateLinks,
      brokenLinksCount: allBrokenLinks.length,
      brokenAffiliateCount,
      estimatedMonthlyLoss: estimatedLoss,
      // Send all broken links — the client gates display (blur after top 3)
      brokenLinks: allBrokenLinks,
    });
  } catch (err) {
    console.error('[free-scan] Scan error:', err);
    return NextResponse.json(
      { error: 'Scan failed. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
