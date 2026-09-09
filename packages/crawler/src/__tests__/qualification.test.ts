import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateQualification,
  isArchivePageCandidate,
  qualifySite,
  type QualificationEvidence,
} from '../qualification';

afterEach(() => {
  vi.unstubAllGlobals();
});

function evidence(overrides: Partial<QualificationEvidence> = {}): QualificationEvidence {
  return {
    target: 'https://publisher.example/',
    discoveryMethod: 'sitemap',
    discoveredUrls: 60,
    archivePageCandidates: 50,
    robotsAllowedCandidates: 50,
    probePagesAttempted: 10,
    pagesFetched: 10,
    substantivePagesSampled: 9,
    outboundLinkOccurrences: 90,
    affiliateLinkOccurrences: 60,
    uniqueAffiliateLinks: 55,
    pagesFetchedViaBrowserProfile: 0,
    pagesFetchedViaHeadless: 0,
    botBlockedPages: 0,
    failedPages: 0,
    budgetExhausted: false,
    durationMs: 12_000,
    ...overrides,
  };
}

describe('evaluateQualification', () => {
  it('passes only when archive, affiliate-density and content gates clear', () => {
    expect(evaluateQualification(evidence())).toEqual({
      decision: 'PASS',
      route: 'start_sprint',
      reasons: ['Public evidence clears the 30-page and 50-affiliate-link gates.'],
    });
  });

  it('declines a sitemap-backed archive below the fixed-scope thresholds', () => {
    const result = evaluateQualification(
      evidence({ archivePageCandidates: 20, affiliateLinkOccurrences: 12 })
    );

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('decline');
    expect(result.reasons).toEqual([
      '20 robots-allowed content-page candidates is below the 30-page gate.',
      '12 affiliate-link occurrences is below the 50-link gate.',
    ]);
  });

  it('does not count robots-disallowed archive URLs toward the paid-sprint gate', () => {
    const result = evaluateQualification(
      evidence({
        archivePageCandidates: 40,
        robotsAllowedCandidates: 5,
        probePagesAttempted: 5,
        pagesFetched: 5,
        substantivePagesSampled: 5,
      })
    );

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('decline');
    expect(result.reasons).toContain(
      '5 robots-allowed content-page candidates is below the 30-page gate.'
    );
  });

  it('routes bot-blocked evidence to manual review instead of calling the site clean', () => {
    const result = evaluateQualification(
      evidence({ botBlockedPages: 3, pagesFetched: 7, failedPages: 3 })
    );

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('manual_review');
    expect(result.reasons.join(' ')).toContain('Automation blocking');
  });

  it('routes browser-profile fallback to manual review as crawler friction', () => {
    const result = evaluateQualification(evidence({ pagesFetchedViaBrowserProfile: 2 }));

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('manual_review');
    expect(result.reasons.join(' ')).toContain('Automation blocking');
  });

  it('fails safely when robots and discovery yield no sampleable pages', () => {
    const result = evaluateQualification(
      evidence({
        robotsAllowedCandidates: 0,
        probePagesAttempted: 0,
        pagesFetched: 0,
        substantivePagesSampled: 0,
      })
    );

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('manual_review');
    expect(result.reasons).toContain(
      'Discovery and robots.txt produced no public HTML pages that could be sampled.'
    );
    expect(result.reasons.join(' ')).not.toContain('0/0');
  });

  it('requires manual review when a crawl cannot prove archive size', () => {
    const result = evaluateQualification(
      evidence({
        discoveryMethod: 'crawl',
        discoveredUrls: 10,
        archivePageCandidates: 9,
        robotsAllowedCandidates: 9,
        probePagesAttempted: 9,
        pagesFetched: 9,
      })
    );

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('manual_review');
    expect(result.reasons).toContain('No sitemap proved the archive-size threshold.');
  });

  it('fails safely when the time budget expires', () => {
    const result = evaluateQualification(evidence({ budgetExhausted: true }));

    expect(result.decision).toBe('FAIL');
    expect(result.route).toBe('manual_review');
  });
});

describe('isArchivePageCandidate', () => {
  it('keeps likely content pages on the target domain', () => {
    expect(
      isArchivePageCandidate('https://publisher.example/reviews/best-camera', 'publisher.example')
    ).toBe(true);
  });

  it('removes utility pages, feeds, assets and external URLs', () => {
    expect(isArchivePageCandidate('https://publisher.example/privacy', 'publisher.example')).toBe(
      false
    );
    expect(isArchivePageCandidate('https://publisher.example/feed/', 'publisher.example')).toBe(
      false
    );
    expect(isArchivePageCandidate('https://publisher.example/photo.jpg', 'publisher.example')).toBe(
      false
    );
    expect(isArchivePageCandidate('https://merchant.example/product', 'publisher.example')).toBe(
      false
    );
  });
});

describe('qualifySite', () => {
  it('collects a bounded public sample and returns a passing evidence record', async () => {
    const domain = '93.184.216.34';
    const urls = Array.from(
      { length: 40 },
      (_, index) => `https://${domain}/reviews/article-${index + 1}`
    );
    const sitemap = `<?xml version="1.0"?><urlset>${urls
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join('')}</urlset>`;
    const affiliateLinks = Array.from(
      { length: 6 },
      (_, index) => `<a href="https://merchant.example/product-${index}?ref=publisher">Buy</a>`
    ).join('');
    const article = `<html><body>${'substantive article word '.repeat(60)}${affiliateLinks}</body></html>`;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/robots.txt')) {
        return new Response('User-agent: *\nAllow: /', { status: 200 });
      }
      if (url.endsWith('/sitemap.xml')) {
        return new Response(sitemap, {
          status: 200,
          headers: { 'content-type': 'application/xml' },
        });
      }
      return new Response(article, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await qualifySite(`https://${domain}`, {
      maxDurationMs: 5_000,
    });

    expect(result.decision).toBe('PASS');
    expect(result.route).toBe('start_sprint');
    expect(result.evidence.archivePageCandidates).toBe(40);
    expect(result.evidence.probePagesAttempted).toBe(10);
    expect(result.evidence.affiliateLinkOccurrences).toBe(60);
    expect(result.evidence.uniqueAffiliateLinks).toBe(6);
  });
});
