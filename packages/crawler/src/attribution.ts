/**
 * Affiliate attribution rules — the single source of truth for "is this an
 * affiliate link" and "did its tracking survive".
 *
 * Why this exists: the June 2026 study reported 569 LOST_PARAMS issues. On
 * inspection (2026-09-21) 339 were social share buttons, 7 were photo credits,
 * 59 were network links whose tracking demonstrably survived, and most of the
 * rest were bot-block pages. Only 6 were real. Two mistakes caused that:
 *
 *   1. Anything carrying `ref=` or `utm_` counted as an affiliate link.
 *   2. Any parameter missing from the final URL counted as lost — including a
 *      network consuming its own parameters, which is how networks work: Awin,
 *      CJ, Impact etc. read the params, set their cookie or click id, and send
 *      the reader on without them.
 *
 * The rule now: tracking is lost only when it never reached the party that
 * records it. If the link points at a network, at Amazon, or at the merchant's
 * own domain, the tracker received the request with the tag — delivered. Loss
 * is only possible when an intermediary (a shortener, a third-party cloak)
 * forwards to a different domain without the tag, and no click id shows up on
 * arrival either.
 */

/** Links that are never affiliate links and are not worth checking at all. */
const UTILITY_RULES: Array<{ host: RegExp; path?: RegExp }> = [
  { host: /(^|\.)facebook\.com$/, path: /^\/(sharer|share|dialog\/(share|feed))/ },
  { host: /(^|\.)(twitter|x)\.com$/, path: /^\/(intent|share)/ },
  { host: /(^|\.)pinterest\.[a-z.]+$/, path: /^\/pin\/create/ },
  { host: /(^|\.)linkedin\.com$/, path: /^\/(sharing|shareArticle|cws\/share)/i },
  { host: /(^|\.)reddit\.com$/, path: /^\/submit/ },
  { host: /^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)$/ },
  { host: /^(t\.me|telegram\.me)$/, path: /^\/share/ },
  { host: /(^|\.)tumblr\.com$/, path: /^\/(share|widgets\/share)/ },
  { host: /(^|\.)flipboard\.com$/, path: /^\/bookmarklet/ },
  { host: /(^|\.)threads\.net$/, path: /^\/intent/ },
  { host: /^bsky\.app$/, path: /^\/intent/ },
  { host: /^news\.ycombinator\.com$/, path: /^\/submitlink/ },
  { host: /(^|\.)getpocket\.com$/, path: /^\/(save|edit)/ },
  { host: /(^|\.)buffer\.com$/, path: /^\/add/ },
  { host: /(^|\.)mix\.com$/, path: /^\/add/ },
  // Photo-credit links: attribution for the photographer, not a commission.
  { host: /(^|\.)(unsplash|pexels|pixabay)\.com$/ },
];

/**
 * Hosts that *are* the tracker: an affiliate network, a network's vanity
 * redirect domain, or a link service that records the click itself. A request
 * that reaches one of these has delivered its tracking.
 */
const TRACKER_HOSTS = [
  'awin1.com', 'linksynergy.com', 'jdoqocy.com', 'tkqlhce.com', 'dpbolvw.net', 'anrdoezrs.net',
  'kqzyfj.com', 'emjcd.com', 'shareasale.com', 'redirectingat.com', 'skimresources.com',
  'skimlinks.com', 'prf.hn', 'partnerize.com', 'pntra.com', 'pntrs.com', 'pntrac.com', 'gopjn.com',
  'pjtra.com', 'pjatr.com', 'avantlink.com', 'clickbank.net', 'flexoffers.com', 'webgains.com',
  'sjv.io', 'pxf.io', '7eer.net', 'ojrq.net', 'evyy.net', 'impact.com', 'refersion.com',
  'partnerstack.com', 'amzn.to', 'amzn.com', 'geni.us', 'howl.me', 'rstyle.me', 'shopstyle.it',
  'shopmy.us', 'fave.co',
];

/** Amazon retail hosts; an Amazon URL is an affiliate link iff it carries `tag`. */
const AMAZON_HOST = /(^|\.)amazon\.(com|ca|co\.uk|de|fr|it|es|nl|se|pl|co\.jp|com\.au|in|com\.mx|com\.br|sg|ae|sa|com\.tr|eg)$/;

/** Impact's merchant vanity redirects: goto.walmart.com/c/<pub>/<ad>/<campaign>. */
const IMPACT_VANITY_PATH = /^\/c\/\d+\/\d+\/\d+/;

/** Parameters that mark a URL as carrying affiliate tracking, on any host. */
const AFFILIATE_PARAMS = new Set([
  'aff', 'aff_id', 'affid', 'affiliate', 'affiliate_id', 'affiliateid', 'afftrack', 'aff_sub',
  'awinaffid', 'awinmid', 'ps_partner_key', 'ps_xid', 'rfsn', 'irclickid', 'irgwc', 'cjevent',
  'ascsubtag', 'clickref', 'partnercode', 'partner_id', 'ref',
]);

/**
 * Parameters that, when present on the landing URL, show a network handed the
 * visitor over with its own click id — positive proof tracking was recorded.
 */
const LANDING_EVIDENCE_PARAMS = new Set([
  'sscid', 'awc', 'irclickid', 'irgwc', 'cjevent', 'cjdata', 'ranmid', 'raneaid', 'ransiteid',
  'clickid', 'click_id', 'aflt', 'sv1', 'sv_campaign_id', 'afftrack', 'aff_sub', 'tag',
  'ascsubtag', 'utm_medium', // utm_medium=affiliate is how many merchants mark the hand-off
]);

/** Landing URLs that mean the partnership itself is dead. */
const EXPIRED_PROGRAM =
  /expired[-_]?(partner|affiliate|link|offer|program)|(partner|affiliate)[-_]?(link[-_]?)?expired|invalid[-_]?(affiliate|partner)|(affiliate|partner)[-_]?(inactive|disabled|terminated)|program[-_]?(closed|ended|terminated)/i;

/** Landing URLs that mean the checker was stopped by a bot wall, not that the link works or fails. */
const BOT_WALL =
  /\/(blocked|captcha|challenge|robot[-_]?check|are[-_]?you[-_]?a[-_]?robot|sorry\/index|errors\/validatecaptcha|px-captcha|distil_r_captcha)(\/|$|\?)/i;

const TWO_PART_SUFFIX = /\.(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/;

function host(u: URL): string {
  return u.hostname.toLowerCase().replace(/^www\./, '');
}

function hostMatches(h: string, list: string[]): boolean {
  return list.some((d) => h === d || h.endsWith(`.${d}`));
}

/** Approximate registrable domain: good enough to say "same merchant". */
export function registrableDomain(hostname: string): string {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  const labels = h.split('.');
  const keep = TWO_PART_SUFFIX.test(h) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Share buttons, photo credits and similar: skip entirely. */
export function isUtilityLink(url: string): boolean {
  const u = parse(url);
  if (!u) return false;
  const h = host(u);
  return UTILITY_RULES.some((r) => r.host.test(h) && (!r.path || r.path.test(u.pathname)));
}

function isTrackerHost(u: URL): boolean {
  const h = host(u);
  if (hostMatches(h, TRACKER_HOSTS)) return true;
  if (/^goto\./.test(u.hostname.toLowerCase()) && IMPACT_VANITY_PATH.test(u.pathname)) return true;
  return false;
}

/** The affiliate parameters a URL carries, as they appear in it. */
export function affiliateParamsIn(url: string): string[] {
  const u = parse(url);
  if (!u) return [];
  const amazon = AMAZON_HOST.test(host(u));
  const found: string[] = [];
  for (const key of u.searchParams.keys()) {
    const k = key.toLowerCase();
    if (AFFILIATE_PARAMS.has(k) || (amazon && (k === 'tag' || k === 'linkcode'))) found.push(key);
  }
  return found;
}

export function isAmazonUrl(url: string): boolean {
  const u = parse(url);
  return !!u && AMAZON_HOST.test(host(u));
}

export function isAffiliateLink(url: string): boolean {
  const u = parse(url);
  if (!u || isUtilityLink(url)) return false;
  if (isTrackerHost(u)) return true;
  if (AMAZON_HOST.test(host(u))) return u.searchParams.has('tag');
  return affiliateParamsIn(url).length > 0;
}

export function isExpiredProgramLanding(finalUrl: string): boolean {
  const u = parse(finalUrl);
  return !!u && EXPIRED_PROGRAM.test(u.pathname + u.search);
}

export function isBotWallLanding(finalUrl: string): boolean {
  const u = parse(finalUrl);
  return !!u && (BOT_WALL.test(u.pathname) || /captcha/i.test(u.hostname));
}

export type AttributionOutcome =
  /** The tracker received the tag, or a click id proves the hand-off. */
  | 'delivered'
  /** An intermediary forwarded to another domain and no tracking arrived. */
  | 'lost'
  /** Not an affiliate link, or it carries no visible tag to lose. */
  | 'not_applicable'
  /** No final URL to judge. */
  | 'unknown';

export interface AttributionAssessment {
  outcome: AttributionOutcome;
  /** Affiliate params on the original link. */
  trackingParams: string[];
  /** Params that failed to arrive — non-empty only when outcome is 'lost'. */
  lostParams: string[];
}

function carriesTracking(u: URL, trackingParams: string[]): boolean {
  const keys = new Set(Array.from(u.searchParams.keys(), (k) => k.toLowerCase()));
  if (trackingParams.some((p) => keys.has(p.toLowerCase()))) return true;
  for (const k of keys) {
    if (!LANDING_EVIDENCE_PARAMS.has(k)) continue;
    if (k === 'utm_medium' && !/affiliate|partner/i.test(u.searchParams.get('utm_medium') ?? '')) continue;
    return true;
  }
  return false;
}

/**
 * Judge whether an affiliate link's tracking reached the party that records
 * it. `hops` is the full redirect chain (URLs, first to last) when the caller
 * has it; with it, a tag that reached any intermediate tracker counts.
 */
export function assessAttribution(
  originalUrl: string,
  finalUrl: string | null,
  hops: string[] = [],
): AttributionAssessment {
  const trackingParams = affiliateParamsIn(originalUrl);
  const none: AttributionAssessment = { outcome: 'not_applicable', trackingParams, lostParams: [] };

  const original = parse(originalUrl);
  if (!original || !isAffiliateLink(originalUrl) || trackingParams.length === 0) return none;

  const delivered: AttributionAssessment = { outcome: 'delivered', trackingParams, lostParams: [] };

  // The link goes straight to the tracker or to Amazon: the request carried the tag.
  if (isTrackerHost(original) || AMAZON_HOST.test(host(original))) return delivered;

  const final = finalUrl ? parse(finalUrl) : null;
  if (!final) return { outcome: 'unknown', trackingParams, lostParams: [] };

  // Same merchant: it received its own parameter; cookies carry it from there.
  if (registrableDomain(original.hostname) === registrableDomain(final.hostname)) return delivered;

  // Any later hop that is a tracker, or that still carries the tag or a click id.
  for (const hop of [...hops.slice(1), finalUrl as string]) {
    const u = parse(hop);
    if (u && (isTrackerHost(u) || carriesTracking(u, trackingParams))) return delivered;
  }

  return { outcome: 'lost', trackingParams, lostParams: trackingParams };
}
