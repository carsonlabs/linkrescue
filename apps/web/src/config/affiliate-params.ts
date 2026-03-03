/**
 * Affiliate network parameter patterns and domain lists.
 * Single source of truth — used by the link checker API and crawler.
 */

/** Parameters specific to individual affiliate networks */
export const NETWORK_PARAMS: Record<string, string[]> = {
  Amazon: ['tag'],
  ShareASale: ['afftrack'],
  'CJ / Commission Junction': ['cjevent', 'PID', 'AID'],
  Impact: ['irclickid'],
  Rakuten: ['mid', 'murl'],
  Awin: ['awc'],
  PartnerStack: ['ps_partner_key', 'ps_xid'],
  FlexOffers: ['fobs'],
  Refersion: ['rfsn'],
};

/** Generic / cross-network tracking parameters */
export const GENERIC_PARAMS = [
  'ref',
  'aff',
  'aff_id',
  'affiliate',
  'partner',
  'clickid',
  'subid',
  'sub_id',
  'clickref',
  'cid',
  'pid',
  'aid',
  'rid',
  'tid',
  'source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
];

/** Flat set of every affiliate parameter (lower-cased) for fast lookup */
export const ALL_AFFILIATE_PARAMS = new Set<string>(
  [
    ...Object.values(NETWORK_PARAMS).flat(),
    ...GENERIC_PARAMS,
  ].map((p) => p.toLowerCase()),
);

/** Known affiliate / redirect domains */
export const AFFILIATE_DOMAINS = [
  'amzn.to',
  'amazon.com',
  'shareasale.com',
  'cj.com',
  'commission-junction.com',
  'jdoqocy.com',
  'tkqlhce.com',
  'dpbolvw.net',
  'anrdoezrs.net',
  'kqzyfj.com',
  'impact.com',
  'awin1.com',
  'rakuten.com',
  'click.linksynergy.com',
  'go.redirectingat.com',
  'prf.hn',
  'partnerize.com',
  'partnerstack.com',
  'flexoffers.com',
  'refersion.com',
  'clickbank.net',
  'clickbank.com',
  'avantlink.com',
  'pepperjam.com',
  'webgains.com',
];
