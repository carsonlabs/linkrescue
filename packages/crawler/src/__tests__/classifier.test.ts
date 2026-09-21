import { describe, it, expect } from 'vitest';
import { classifyIssue, isAffiliateLink } from '../classifier';

describe('classifyIssue', () => {
  it('classifies 404 as BROKEN_4XX', () => {
    expect(classifyIssue(404, null, 'https://example.com/link', false)).toBe('BROKEN_4XX');
  });

  it('classifies 403 as BLOCKED (bot-block, not a break)', () => {
    expect(classifyIssue(403, null, 'https://example.com/link', false)).toBe('BLOCKED');
  });

  it('classifies 405 as BLOCKED (HEAD rejected)', () => {
    expect(classifyIssue(405, null, 'https://example.com/link', false)).toBe('BLOCKED');
  });

  it('classifies 429 as BLOCKED (rate limited)', () => {
    expect(classifyIssue(429, null, 'https://example.com/link', false)).toBe('BLOCKED');
  });

  it('still classifies 400 as BROKEN_4XX', () => {
    expect(classifyIssue(400, null, 'https://example.com/link', false)).toBe('BROKEN_4XX');
  });

  it('classifies 410 as BROKEN_4XX', () => {
    expect(classifyIssue(410, null, 'https://example.com/link', false)).toBe('BROKEN_4XX');
  });

  it('classifies 500 as SERVER_5XX', () => {
    expect(classifyIssue(500, null, 'https://example.com/link', false)).toBe('SERVER_5XX');
  });

  it('classifies 502 as SERVER_5XX', () => {
    expect(classifyIssue(502, null, 'https://example.com/link', false)).toBe('SERVER_5XX');
  });

  it('classifies 503 as SERVER_5XX', () => {
    expect(classifyIssue(503, null, 'https://example.com/link', false)).toBe('SERVER_5XX');
  });

  it('classifies Amazon 5xx as BLOCKED (throttling, not a dead product)', () => {
    expect(
      classifyIssue(500, 'https://www.amazon.com/Lonely-Planet-Ireland/dp/1742207499', 'http://amzn.to/1PryS3h', false)
    ).toBe('BLOCKED');
  });

  it('still classifies a non-Amazon 500 as SERVER_5XX', () => {
    expect(classifyIssue(500, 'https://merchant.example/p', 'https://merchant.example/p', false)).toBe('SERVER_5XX');
  });

  it('classifies timeout', () => {
    expect(classifyIssue(null, null, 'https://example.com/link', true)).toBe('TIMEOUT');
  });

  it('classifies null status as TIMEOUT', () => {
    expect(classifyIssue(null, null, 'https://example.com/link', false)).toBe('TIMEOUT');
  });

  it('classifies redirect to domain root as REDIRECT_TO_HOME', () => {
    expect(
      classifyIssue(
        200,
        'https://otherdomain.com/',
        'https://affiliate.com/product?id=123',
        false
      )
    ).toBe('REDIRECT_TO_HOME');
  });

  it('classifies redirect to different domain root without slash as REDIRECT_TO_HOME', () => {
    expect(
      classifyIssue(
        200,
        'https://otherdomain.com',
        'https://affiliate.com/product?id=123',
        false
      )
    ).toBe('REDIRECT_TO_HOME');
  });

  it('does not classify redirect to subpage as REDIRECT_TO_HOME', () => {
    expect(
      classifyIssue(
        200,
        'https://otherdomain.com/some-page?id=123',
        'https://affiliate.com/product?id=123',
        false
      )
    ).toBe('OK');
  });

  it('does not flag a non-affiliate link that loses params', () => {
    // Old rule: any dropped param = LOST_PARAMS. That flagged 339 share buttons.
    expect(
      classifyIssue(200, 'https://example.com/product', 'https://example.com/product?utm_source=x', false)
    ).toBe('OK');
  });

  it('flags an affiliate tag that never reaches another domain as LOST_PARAMS', () => {
    expect(
      classifyIssue(200, 'https://merchant.example/product', 'https://short.example/go?aff=publisher123', false)
    ).toBe('LOST_PARAMS');
  });

  it('classifies an expired partner landing as SOFT_404', () => {
    expect(
      classifyIssue(
        200,
        'https://www.worldnomads.com/travel-insurance/expired-partner-link',
        'https://www.worldnomads.com/Turnstile/AffiliateLink?partnerCode=expvaga&path=https://www.worldnomads.com/travel-insurance',
        false
      )
    ).toBe('SOFT_404');
  });

  it('classifies a bot-wall landing as BLOCKED, not OK or LOST_PARAMS', () => {
    expect(
      classifyIssue(
        200,
        'https://www.walmart.com/blocked?url=L2lwL0hBUlQ',
        'https://goto.walmart.com/c/2773249/565706/9383?subid1=abc',
        false
      )
    ).toBe('BLOCKED');
  });

  it('classifies normal 200 as OK', () => {
    expect(classifyIssue(200, 'https://example.com/page', 'https://example.com/link', false)).toBe(
      'OK'
    );
  });
});

describe('isAffiliateLink', () => {
  it('detects amzn.to links', () => {
    expect(isAffiliateLink('https://amzn.to/3xYz123')).toBe(true);
  });

  it('detects shareasale links', () => {
    expect(isAffiliateLink('https://www.shareasale.com/r.cfm?u=123')).toBe(true);
  });

  it('detects ref= parameter', () => {
    expect(isAffiliateLink('https://example.com/product?ref=affiliate123')).toBe(true);
  });

  it('detects aff= parameter', () => {
    expect(isAffiliateLink('https://example.com/product?aff=123')).toBe(true);
  });

  it('detects Amazon tag= parameter', () => {
    expect(isAffiliateLink('https://www.amazon.com/dp/B0D7NG8L8Q?tag=mytag-20')).toBe(true);
  });

  it('does not treat tag= off Amazon as affiliate', () => {
    expect(isAffiliateLink('https://example.com/blog?tag=recipes')).toBe(false);
  });

  it('does not treat utm_ tracking as affiliate', () => {
    expect(isAffiliateLink('https://example.com/page?utm_source=newsletter')).toBe(false);
  });

  it('detects affiliate in URL', () => {
    expect(isAffiliateLink('https://example.com/page?affiliate=123')).toBe(true);
  });

  it('detects clickbank links', () => {
    expect(isAffiliateLink('https://clickbank.net/product')).toBe(true);
  });

  it('detects impact links', () => {
    expect(isAffiliateLink('https://impact.com/campaign')).toBe(true);
  });

  it('does not flag normal links', () => {
    expect(isAffiliateLink('https://example.com/about')).toBe(false);
  });

  it('does not flag links with ref in path', () => {
    expect(isAffiliateLink('https://example.com/reference-page')).toBe(false);
  });

  it('handles invalid URLs gracefully', () => {
    expect(isAffiliateLink('not-a-url')).toBe(false);
  });
});
