/**
 * Tunable crawl and request constants.
 *
 * All timing values are in milliseconds unless noted.
 * Change these to adjust crawler politeness without touching logic.
 */

// ── Pacing ──────────────────────────────────────────────────────────
/** Minimum delay between requests to the SAME domain (ms). */
export const CRAWL_DELAY_MS = 500;

/** Global concurrency cap for outbound fetches during a single scan. */
export const MAX_CONCURRENT_FETCHES = 5;

/** Per-page fetch timeout (ms). */
export const PAGE_FETCH_TIMEOUT_MS = 10_000;

/** Per-link-check fetch timeout (ms). */
export const LINK_CHECK_TIMEOUT_MS = 10_000;

// ── Retry ───────────────────────────────────────────────────────────
/** Maximum retry attempts for transient failures (timeout, network, 5xx). */
export const MAX_RETRIES = 2;

/** Base delay before first retry (ms). Doubled on each subsequent attempt. */
export const RETRY_BASE_DELAY_MS = 1_500;

/** Maximum jitter added to retry delay (ms). */
export const RETRY_JITTER_MAX_MS = 500;

/** Maximum redirect hops before giving up on a link. */
export const MAX_REDIRECT_HOPS = 5;

// ── robots.txt ──────────────────────────────────────────────────────
/** Timeout for fetching a robots.txt file (ms). */
export const ROBOTS_FETCH_TIMEOUT_MS = 5_000;

// ── User-Agent ──────────────────────────────────────────────────────
export const CRAWLER_USER_AGENT = 'LinkRescue-Crawler/1.0 (+https://linkrescue.io/crawler)';
export const CHECKER_USER_AGENT = 'LinkRescue-Checker/1.0 (+https://linkrescue.io/crawler)';
