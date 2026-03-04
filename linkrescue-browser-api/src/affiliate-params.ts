/**
 * Affiliate network parameter patterns and domain lists.
 * Standalone copy for the browser testing API service.
 *
 * Keep in sync with: apps/web/src/config/affiliate-params.ts
 */

export interface AffiliateNetwork {
  name: string;
  params: string[];
  pathPatterns?: RegExp[];
}

export const AFFILIATE_NETWORKS: AffiliateNetwork[] = [
  {
    name: 'Amazon Associates',
    params: ['tag', 'ascsubtag', 'linkCode', 'linkId'],
  },
  {
    name: 'ShareASale',
    params: ['afftrack', 'sscid'],
  },
  {
    name: 'Commission Junction (CJ)',
    params: ['cjevent', 'PID', 'AID', 'SID'],
  },
  {
    name: 'Impact',
    params: ['irclickid', 'irgwc'],
  },
  {
    name: 'Rakuten',
    params: ['mid', 'murl', 'u1'],
  },
  {
    name: 'Awin',
    params: ['awc', 'awinaffid', 'awinmid'],
  },
  {
    name: 'Skimlinks',
    params: ['id', 'xs', 'xcust'],
  },
  {
    name: 'PartnerStack',
    params: ['ps_partner_key', 'ps_xid', 'via'],
  },
  {
    name: 'FlexOffers',
    params: ['fobs'],
  },
  {
    name: 'Refersion',
    params: ['rfsn'],
  },
  {
    name: 'ClickBank',
    params: ['hop', 'cbfid'],
  },
  {
    name: 'Generic / Common',
    params: ['ref', 'aff', 'aff_id', 'affid', 'clickid', 'click_id', 'subid', 'sub_id'],
  },
];

/** Flat set of every affiliate parameter (lower-cased) for fast lookup */
export const ALL_AFFILIATE_PARAMS = new Set<string>(
  AFFILIATE_NETWORKS.flatMap((n) => n.params).map((p) => p.toLowerCase()),
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
  'go.skimresources.com',
  'skimlinks.com',
  'redirectingat.com',
  'rakutenmarketing.com',
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DetectedParam {
  network: string;
  param: string;
  value: string;
}

export interface ParamSurvival {
  param: string;
  network: string;
  originalValue: string;
  survived: boolean;
  finalValue: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Given a URL, detect which affiliate parameters are present */
export function detectAffiliateParams(url: string): DetectedParam[] {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }

  const found: DetectedParam[] = [];
  for (const network of AFFILIATE_NETWORKS) {
    for (const param of network.params) {
      const value = parsed.searchParams.get(param);
      if (value) {
        found.push({ network: network.name, param, value });
      }
    }
  }
  return found;
}

/** Compare two URLs and check if affiliate params survived the redirect chain */
export function compareParamSurvival(originalUrl: string, finalUrl: string): ParamSurvival[] {
  const originalParams = detectAffiliateParams(originalUrl);
  let finalParsed: URL;
  try {
    finalParsed = new URL(finalUrl);
  } catch {
    return originalParams.map((p) => ({
      param: p.param,
      network: p.network,
      originalValue: p.value,
      survived: false,
      finalValue: null,
    }));
  }

  return originalParams.map(({ network, param, value }) => {
    const finalValue = finalParsed.searchParams.get(param);
    return {
      param,
      network,
      originalValue: value,
      survived: finalValue === value,
      finalValue,
    };
  });
}

/** Quick boolean check: does this URL have any affiliate params or match a known domain? */
export function isAffiliateUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const hasParam = Array.from(parsed.searchParams.keys()).some((key) =>
    ALL_AFFILIATE_PARAMS.has(key.toLowerCase()),
  );
  if (hasParam) return true;

  return AFFILIATE_DOMAINS.some(
    (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
  );
}
