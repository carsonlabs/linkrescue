/**
 * Per-domain pacing for outbound link checks.
 *
 * Ensures we don't hammer a single merchant domain when checking many links
 * that all point to the same host (e.g. 50 Amazon affiliate links on one page).
 *
 * Each domain gets a minimum delay between requests. The limiter tracks the
 * last request time per domain and introduces a sleep if needed.
 */

const DEFAULT_DOMAIN_DELAY_MS = 1_000;

export class DomainLimiter {
  /** Next moment a request to the domain is allowed (slot reservation). */
  private nextAllowedAt = new Map<string, number>();
  private readonly delayMs: number;

  constructor(delayMs: number = DEFAULT_DOMAIN_DELAY_MS) {
    this.delayMs = delayMs;
  }

  /**
   * Wait until it's safe to make a request to the given domain.
   * Returns true if a delay was applied, false if no wait was needed.
   *
   * Concurrency-safe: the slot is reserved synchronously before any await,
   * so concurrent callers for the same domain queue up on consecutive slots
   * instead of racing through together.
   */
  async acquire(hostname: string): Promise<boolean> {
    const domain = hostname.toLowerCase();
    const now = Date.now();
    const slot = Math.max(this.nextAllowedAt.get(domain) ?? 0, now);
    this.nextAllowedAt.set(domain, slot + this.delayMs);

    const waitMs = slot - now;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return true;
    }
    return false;
  }

  /** Track a 429 response from a domain. Enforces a longer cooldown. */
  recordRateLimit(hostname: string): void {
    const domain = hostname.toLowerCase();
    const current = this.nextAllowedAt.get(domain) ?? 0;
    this.nextAllowedAt.set(domain, Math.max(current, Date.now() + this.delayMs * 2));
  }
}
