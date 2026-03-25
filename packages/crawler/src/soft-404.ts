/**
 * Soft-404 detection: identifies pages that return HTTP 200 but display
 * error/not-found content. Uses fast heuristic pattern matching.
 *
 * This catches:
 * - "Page not found" / "404" text in the body
 * - Login walls / access denied pages
 * - Empty product pages (e.g., expired Amazon listings)
 * - "No longer available" / "removed" / "expired" content
 */

/** Patterns that strongly indicate a soft-404 when found in page content */
const SOFT_404_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  // Direct 404 signals
  { pattern: /page\s*not\s*found/i, weight: 40 },
  { pattern: /<title>[^<]*404[^<]*<\/title>/i, weight: 50 },
  { pattern: /error\s*404/i, weight: 45 },
  { pattern: /404\s*error/i, weight: 45 },
  { pattern: /404\s*-\s*not\s*found/i, weight: 50 },
  { pattern: /the\s*page\s*you\s*(are\s*)?looking\s*for/i, weight: 35 },
  { pattern: /this\s*page\s*(doesn.t|does\s*not)\s*exist/i, weight: 45 },
  { pattern: /page\s*(has\s*been|was)\s*(removed|deleted|taken\s*down)/i, weight: 45 },

  // Expired / unavailable content
  { pattern: /no\s*longer\s*available/i, weight: 40 },
  { pattern: /this\s*(item|product|listing)\s*is\s*(no\s*longer|not)\s*available/i, weight: 45 },
  { pattern: /currently\s*unavailable/i, weight: 30 },
  { pattern: /this\s*offer\s*(has\s*)?expired/i, weight: 45 },
  { pattern: /deal\s*(has\s*)?expired/i, weight: 40 },
  { pattern: /this\s*coupon\s*(has\s*)?expired/i, weight: 45 },

  // Amazon-specific patterns
  { pattern: /looking\s*for\s*something\?.*we\s*didn.t\s*find\s*results/i, weight: 40 },
  { pattern: /sorry,\s*we\s*just\s*need\s*to\s*make\s*sure\s*you.re\s*not\s*a\s*robot/i, weight: 25 },

  // Login walls
  { pattern: /you\s*must\s*(be\s*)?log(ged)?\s*in/i, weight: 30 },
  { pattern: /sign\s*in\s*to\s*(continue|view|access)/i, weight: 30 },
  { pattern: /please\s*(log\s*in|sign\s*in)\s*to\s*(continue|view|access)/i, weight: 35 },

  // Access denied
  { pattern: /access\s*denied/i, weight: 35 },
  { pattern: /you\s*don.t\s*have\s*permission/i, weight: 35 },
  { pattern: /forbidden/i, weight: 25 },
];

/** Minimum score threshold to classify as soft-404 */
const SOFT_404_THRESHOLD = 40;

/** Maximum body size to analyze (characters). Larger bodies are truncated. */
const MAX_BODY_SIZE = 50_000;

export interface Soft404Result {
  isSoft404: boolean;
  score: number;
  signals: string[];
}

/**
 * Analyze an HTTP 200 response body for soft-404 signals.
 * Returns a score and the signals that triggered.
 *
 * Only call this when statusCode is 200-299.
 */
export function detectSoft404(bodyHtml: string): Soft404Result {
  const body = bodyHtml.slice(0, MAX_BODY_SIZE);
  const signals: string[] = [];
  let score = 0;

  for (const { pattern, weight } of SOFT_404_PATTERNS) {
    if (pattern.test(body)) {
      signals.push(pattern.source.slice(0, 60));
      score += weight;
    }
  }

  // Additional heuristic: very short body with no meaningful content
  // (common for stub pages that return 200)
  const textContent = body.replace(/<[^>]*>/g, '').trim();
  if (textContent.length < 200 && textContent.length > 0) {
    // Short page — check if it's mostly boilerplate
    const meaningfulWords = textContent.split(/\s+/).filter((w) => w.length > 3);
    if (meaningfulWords.length < 20) {
      score += 15;
      signals.push('very_short_content');
    }
  }

  return {
    isSoft404: score >= SOFT_404_THRESHOLD,
    score,
    signals,
  };
}
