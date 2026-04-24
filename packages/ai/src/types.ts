export interface DeadLinkAnalysis {
  topic: string;
  intent: string;
  keywords: string[];
}

export interface OfferMatchResult {
  offer_id: string;
  score: number; // 0-100
  reason: string;
}

export interface OfferInput {
  id: string;
  title: string;
  url: string;
  topic: string;
  tags: string[];
}

/**
 * Compact per-user preference signal, derived from historical match outcomes
 * and dismissal patterns. Passed to matchOffers so Claude can bias toward
 * offers the user has historically preferred, and away from ones they rejected.
 */
export interface UserPreferences {
  /** Offers the user explicitly applied (status='applied'). Truncated to recent. */
  appliedOffers: Array<{ title: string; topic: string; tags: string[] }>;
  /** Offers the user explicitly rejected (status='rejected'). Truncated to recent. */
  rejectedOffers: Array<{ title: string; topic: string; tags: string[] }>;
  /**
   * Hosts where the user has dismissed alerts entirely (pattern_host dismissals).
   * Positive signal — they still use these domains and chose to suppress noise,
   * so replacements on these hosts are welcome.
   */
  toleratedHosts: string[];
  /** Free-text notes the user has attached to dismissals ("amazon regional redirect"). */
  reasonNotes: string[];
}
