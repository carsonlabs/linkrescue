/**
 * Lightweight robots.txt parser for crawl governance.
 *
 * Used to respect Disallow/Allow/Crawl-Delay directives when crawling the
 * user's own site (internal crawl). Outbound link checks use a separate,
 * lighter policy — see link-checker.ts.
 */

import { ROBOTS_FETCH_TIMEOUT_MS, CRAWLER_USER_AGENT } from './crawl-config';

interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelay: number | null;
}

const EMPTY_RULES: RobotsRules = { disallow: [], allow: [], crawlDelay: null };

/**
 * In-memory cache keyed by origin (e.g. "https://example.com").
 * Lives for the duration of a single scan process.
 */
const cache = new Map<string, RobotsRules>();

/**
 * Fetch and parse robots.txt for the given origin.
 * Results are cached per-origin for the lifetime of the process.
 *
 * On any failure (404, timeout, parse error), returns permissive empty rules
 * so the crawl is not blocked by a missing/broken robots.txt.
 */
export async function getRobotsRules(origin: string): Promise<RobotsRules> {
  if (cache.has(origin)) {
    return cache.get(origin)!;
  }

  let rules: RobotsRules;
  try {
    const url = `${origin.replace(/\/+$/, '')}/robots.txt`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ROBOTS_FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': CRAWLER_USER_AGENT },
    });

    if (!res.ok) {
      rules = EMPTY_RULES;
    } else {
      const text = await res.text();
      rules = parseRobotsTxt(text);
    }
  } catch {
    // Network failure, timeout — allow crawl
    rules = EMPTY_RULES;
  }

  cache.set(origin, rules);
  return rules;
}

/**
 * Returns true if the path is allowed for our crawler UA.
 */
export function isPathAllowed(rules: RobotsRules, pathname: string): boolean {
  // Allow rules take precedence when they are more specific (longer match).
  // Per Google's robots.txt spec: most specific match wins.
  let bestMatch = '';
  let bestResult = true; // default: allowed

  for (const pattern of rules.allow) {
    if (pathMatches(pathname, pattern) && pattern.length > bestMatch.length) {
      bestMatch = pattern;
      bestResult = true;
    }
  }

  for (const pattern of rules.disallow) {
    if (pathMatches(pathname, pattern) && pattern.length > bestMatch.length) {
      bestMatch = pattern;
      bestResult = false;
    }
  }

  return bestResult;
}

/**
 * Clear the in-memory cache. Call between scans if needed.
 */
export function clearRobotsCache(): void {
  cache.clear();
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Simple robots.txt path matching.
 * Supports `*` wildcard and `$` end-of-path anchor.
 */
function pathMatches(pathname: string, pattern: string): boolean {
  if (pattern === '') return false;

  // Convert pattern to regex
  let regex = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      regex += '.*';
    } else if (c === '$' && i === pattern.length - 1) {
      regex += '$';
    } else {
      regex += escapeRegex(c);
    }
  }

  try {
    return new RegExp(`^${regex}`).test(pathname);
  } catch {
    // Malformed pattern — treat as no match
    return false;
  }
}

function escapeRegex(c: string): string {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse robots.txt content. Extracts rules for our user-agent and the
 * wildcard (*) user-agent. Our agent-specific rules take precedence if present.
 */
function parseRobotsTxt(text: string): RobotsRules {
  const lines = text.split(/\r?\n/);

  const wildcardRules: RobotsRules = { disallow: [], allow: [], crawlDelay: null };
  const agentRules: RobotsRules = { disallow: [], allow: [], crawlDelay: null };

  let currentTarget: RobotsRules | null = null;
  let sawOurAgent = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      const ua = value.toLowerCase();
      if (ua === '*') {
        currentTarget = wildcardRules;
      } else if (
        ua === 'linkrescue-crawler' ||
        ua.startsWith('linkrescue-crawler/')
      ) {
        currentTarget = agentRules;
        sawOurAgent = true;
      } else {
        currentTarget = null; // not our section
      }
      continue;
    }

    if (!currentTarget) continue;

    if (directive === 'disallow' && value) {
      currentTarget.disallow.push(value);
    } else if (directive === 'allow' && value) {
      currentTarget.allow.push(value);
    } else if (directive === 'crawl-delay') {
      const delay = parseFloat(value);
      if (!isNaN(delay) && delay >= 0) {
        currentTarget.crawlDelay = delay;
      }
    }
  }

  // Use our agent-specific rules if present, otherwise fall back to wildcard
  return sawOurAgent ? agentRules : wildcardRules;
}
