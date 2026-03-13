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
  private lastRequestAt = new Map<string, number>();
  private readonly delayMs: number;

  constructor(delayMs: number = DEFAULT_DOMAIN_DELAY_MS) {
    this.delayMs = delayMs;
  }

  /**
   * Wait until it's safe to make a request to the given domain.
   * Returns true if a delay was applied, false if no wait was needed.
   */
  async acquire(hostname: string): Promise<boolean> {
    const domain = hostname.toLowerCase();
    const now = Date.now();
    const lastAt = this.lastRequestAt.get(domain) ?? 0;
    const elapsed = now - lastAt;

    if (elapsed < this.delayMs) {
      const waitMs = this.delayMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.lastRequestAt.set(domain, Date.now());
      return true;
    }

    this.lastRequestAt.set(domain, now);
    return false;
  }

  /** Track a 429 response from a domain. Doubles the delay for that domain. */
  recordRateLimit(hostname: string): void {
    const domain = hostname.toLowerCase();
    // Push the last-request timestamp forward to enforce a longer cooldown
    this.lastRequestAt.set(domain, Date.now() + this.delayMs);
  }
}
