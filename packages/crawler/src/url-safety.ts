/**
 * URL safety utilities — SSRF protection and URL validation.
 *
 * Must be called before every outbound fetch in the crawler and link-checker
 * to prevent requests to private/internal hosts.
 *
 * Two layers of protection:
 * 1. Hostname pattern matching (fast, synchronous) — catches obvious private hosts.
 * 2. DNS resolution check (async) — catches hostnames that resolve to private IPs.
 *    This blocks DNS rebinding and misconfigured domains pointing to internal ranges.
 */

import { resolve as dnsResolve } from 'dns/promises';

/**
 * Returns true if the hostname matches a known private, loopback, or
 * link-local pattern that should never be fetched by the crawler.
 */
export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '[::1]' ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.localhost')
  );
}

/**
 * Returns true if an IP address string falls in a private/loopback/link-local range.
 */
export function isPrivateIp(ip: string): boolean {
  // IPv4
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  if (ip === '0.0.0.0') return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;

  // IPv6 loopback and link-local
  if (ip === '::1' || ip === '::') return true;
  if (ip.toLowerCase().startsWith('fe80:')) return true;
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) return isPrivateIp(v4Mapped[1]);

  return false;
}

/**
 * Validates a URL string is safe to fetch (synchronous hostname check only).
 * Returns the parsed URL or null if the URL is unsafe.
 */
export function validateFetchUrl(urlString: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return null;
  }

  // Only http(s) allowed
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Block private/internal hosts
  if (isPrivateHost(parsed.hostname)) {
    return null;
  }

  return parsed;
}

/**
 * DNS-aware SSRF validation. Resolves the hostname and checks that none of
 * the resolved IPs are private/loopback/link-local.
 *
 * Call this before fetching a URL when you need the strongest SSRF protection.
 * Falls back to hostname-only check if DNS resolution fails (e.g. platform
 * restrictions, network errors) — this is a defense-in-depth approach.
 *
 * Caveat: On Vercel Edge/Serverless, dns.resolve may have limited support.
 * In that case we log once and fall back to the hostname check, which still
 * catches the most common SSRF vectors.
 */
let dnsWarningLogged = false;

export async function validateFetchUrlWithDns(urlString: string): Promise<URL | null> {
  // First pass: synchronous hostname check
  const parsed = validateFetchUrl(urlString);
  if (!parsed) return null;

  // If the hostname is already an IP literal, isPrivateHost already checked it
  if (/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) || parsed.hostname.startsWith('[')) {
    return parsed;
  }

  // Second pass: DNS resolution check
  try {
    const addresses = await dnsResolve(parsed.hostname);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return null;
      }
    }
  } catch {
    // DNS resolution not available or failed — fall back to hostname-only.
    if (!dnsWarningLogged) {
      console.warn('[url-safety] DNS resolution unavailable, falling back to hostname check');
      dnsWarningLogged = true;
    }
  }

  return parsed;
}
