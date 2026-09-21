import { describe, expect, it } from 'vitest';
import {
  assessAttribution,
  isAffiliateLink,
  isBotWallLanding,
  isExpiredProgramLanding,
  isUtilityLink,
  registrableDomain,
} from '../attribution';

// Every URL below is a real link (or its exact shape) from the June 2026 study,
// where the old rules produced 569 LOST_PARAMS of which 6 were real.

describe('isUtilityLink — share buttons and credits are not outbound content', () => {
  it.each([
    'https://www.facebook.com/sharer/sharer.php?u=https://www.budgetbytes.com/x/&display=popup&ref=plugin&src=share_button',
    'https://twitter.com/intent/tweet?url=https://a.test&via=site',
    'https://x.com/intent/post?text=hi',
    'https://www.pinterest.com/pin/create/button/?url=https://a.test',
    'https://www.linkedin.com/sharing/share-offsite/?url=https://a.test',
    'https://unsplash.com/photos/iQzzKtuatG4?utm_source=Stockpack&utm_medium=referral',
  ])('%s', (url) => {
    expect(isUtilityLink(url)).toBe(true);
    expect(isAffiliateLink(url)).toBe(false);
  });

  it('leaves ordinary facebook and pinterest pages alone', () => {
    expect(isUtilityLink('https://www.facebook.com/budgetbytes')).toBe(false);
    expect(isUtilityLink('https://www.pinterest.com/budgetbytes/')).toBe(false);
  });
});

describe('isAffiliateLink', () => {
  it('recognises networks and Impact vanity redirects', () => {
    expect(isAffiliateLink('https://www.awin1.com/cread.php?awinmid=6776&awinaffid=250759')).toBe(true);
    expect(isAffiliateLink('https://homedepot.sjv.io/c/2773249/456723/8154?subid1=x')).toBe(true);
    expect(isAffiliateLink('https://goto.walmart.com/c/2773249/565706/9383?subid1=x')).toBe(true);
  });

  it('only counts Amazon when it carries a tag', () => {
    expect(isAffiliateLink('https://www.amazon.com/dp/B0D7NG8L8Q?tag=cleve05e-20')).toBe(true);
    expect(isAffiliateLink('https://www.amazon.com/dp/B0D7NG8L8Q')).toBe(false);
  });
});

describe('assessAttribution', () => {
  it('Awin -> merchant with a click id on arrival is delivered (Gardening Know How)', () => {
    const r = assessAttribution(
      'https://www.awin1.com/awclick.php?awinmid=67240&awinaffid=103504&clickref=gkh-1&p=https%3A%2F%2Fnaturehills.com%2Fpr',
      'https://naturehills.com/products/balloon-flower?sv1=affiliate&sv_campaign_id=103504&sscid=67240_1781',
    );
    expect(r.outcome).toBe('delivered');
  });

  it('Awin -> Booking with no click id visible is still delivered: the network got the request (Travel Freak)', () => {
    const r = assessAttribution(
      'https://www.awin1.com/cread.php?awinmid=6776&awinaffid=250759&clickref=guide&ued=https%3A%2F%2Fwww.booking.com',
      'https://www.booking.com/searchresults.html?dest_id=5268;dest_type=district',
    );
    expect(r.outcome).toBe('delivered');
  });

  it('Amazon dropping the tag on a variant redirect is delivered: Amazon received it (Clever Hiker)', () => {
    const r = assessAttribution(
      'https://www.amazon.com/Topo-Athletic/dp/B0D7NG8L8Q?tag=cleve05e-20',
      'https://www.amazon.com/Topo-Athletic/dp/B0D7NCCS67',
    );
    expect(r.outcome).toBe('delivered');
  });

  it('a merchant link that keeps its own domain is delivered', () => {
    const r = assessAttribution('https://merchant.example/p?ref=publisher', 'https://shop.merchant.example/p');
    expect(r.outcome).toBe('delivered');
  });

  it('an intermediary that forwards to another domain without the tag is lost', () => {
    const r = assessAttribution('https://short.example/go?aff=publisher123', 'https://merchant.example/product');
    expect(r).toEqual({ outcome: 'lost', trackingParams: ['aff'], lostParams: ['aff'] });
  });

  it('an intermediary is delivered if any hop in the chain reached a tracker', () => {
    const r = assessAttribution('https://short.example/go?aff=publisher123', 'https://merchant.example/product', [
      'https://short.example/go?aff=publisher123',
      'https://www.awin1.com/cread.php?x=1',
      'https://merchant.example/product',
    ]);
    expect(r.outcome).toBe('delivered');
  });

  it('share buttons are not applicable, whatever they drop', () => {
    const r = assessAttribution(
      'https://www.facebook.com/sharer/sharer.php?u=https://a.test&ref=plugin',
      'https://www.facebook.com/share_channel/?type=reshare',
    );
    expect(r.outcome).toBe('not_applicable');
  });
});

describe('landing detectors', () => {
  it('spots an expired partnership (Expert Vagabond -> World Nomads)', () => {
    expect(isExpiredProgramLanding('https://www.worldnomads.com/travel-insurance/expired-partner-link')).toBe(true);
    expect(isExpiredProgramLanding('https://www.worldnomads.com/travel-insurance')).toBe(false);
  });

  it('spots bot walls', () => {
    expect(isBotWallLanding('https://www.walmart.com/blocked?url=abc')).toBe(true);
    expect(isBotWallLanding('https://www.amazon.com/errors/validateCaptcha')).toBe(true);
    expect(isBotWallLanding('https://www.walmart.com/ip/tape-measure/172573846')).toBe(false);
  });

  it('registrableDomain handles two-part suffixes', () => {
    expect(registrableDomain('shop.merchant.co.uk')).toBe('merchant.co.uk');
    expect(registrableDomain('www.amazon.com')).toBe('amazon.com');
  });
});
