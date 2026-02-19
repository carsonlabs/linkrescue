import { describe, it, expect } from 'vitest';
import { classifyIssue, isAffiliateLink } from '../classifier';

describe('classifyIssue', () => {
  it('classifies 404 as BROKEN_4XX', () => {
    expect(classifyIssue(404, null, 'https://example.com/link', false)).toBe('BROKEN_4XX');
  });

  it('classifies 403 as BROKEN_4XX', () => {
    expect(classifyIssue(403, null, 'https://example.com/link', false)).toBe('BROKEN_4XX');
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

  it('classifies lost query params as LOST_PARAMS', () => {
    expect(
      classifyIssue(
        200,
        'https://example.com/product',
        'https://example.com/product?ref=abc&tag=xyz',
        false
      )
    ).toBe('LOST_PARAMS');
  });

  it('classifies partial param loss as LOST_PARAMS', () => {
    expect(
      classifyIssue(
        200,
        'https://example.com/product?ref=abc',
        'https://example.com/product?ref=abc&tag=xyz',
        false
      )
    ).toBe('LOST_PARAMS');
  });

  it('classifies 200 with same params as OK', () => {
    expect(
      classifyIssue(
        200,
        'https://example.com/product?ref=abc',
        'https://example.com/product?ref=abc',
        false
      )
    ).toBe('OK');
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

  it('detects tag= parameter', () => {
    expect(isAffiliateLink('https://example.com/product?tag=mytag-20')).toBe(true);
  });

  it('detects utm_ parameter', () => {
    expect(isAffiliateLink('https://example.com/page?utm_source=newsletter')).toBe(true);
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
