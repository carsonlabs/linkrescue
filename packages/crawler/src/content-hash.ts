/**
 * Content change detection for outbound links.
 *
 * On first encounter, we compute a content fingerprint (simhash-style).
 * On subsequent scans, we compare fingerprints to detect significant changes.
 * This catches expired affiliate offers, swapped product pages, etc.
 */

/**
 * Extract meaningful text content from HTML, stripping tags, scripts, styles,
 * and normalizing whitespace. Used for content fingerprinting.
 */
export function extractTextContent(html: string): string {
  return html
    // Remove scripts and styles
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/&\w+;/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute a simple 32-bit hash of text content.
 * Uses FNV-1a for speed and reasonable distribution.
 */
export function hashContent(text: string): string {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Compute a set of shingles (word n-grams) for similarity comparison.
 * Uses 3-word shingles for a balance between precision and noise.
 */
function computeShingles(text: string, n: number = 3): Set<string> {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

/**
 * Compute Jaccard similarity between two sets of shingles.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface ContentChangeResult {
  /** Whether content has changed significantly */
  hasChanged: boolean;
  /** Similarity score 0-1 (1 = identical) */
  similarity: number;
  /** New content hash */
  newHash: string;
}

/** Similarity threshold below which we flag as CONTENT_CHANGED */
const CHANGE_THRESHOLD = 0.4; // Less than 40% similar = significant change

/**
 * Compare current page content against a previous version.
 * Returns whether the content has changed significantly.
 *
 * @param currentHtml - Current HTML body
 * @param previousText - Previously stored text content
 */
export function detectContentChange(
  currentHtml: string,
  previousText: string,
): ContentChangeResult {
  const currentText = extractTextContent(currentHtml);
  const newHash = hashContent(currentText);

  // Short-circuit: if previous text is empty, this is a first scan
  if (!previousText) {
    return { hasChanged: false, similarity: 1, newHash };
  }

  // Quick check: exact hash match
  const prevHash = hashContent(previousText);
  if (newHash === prevHash) {
    return { hasChanged: false, similarity: 1, newHash };
  }

  // Detailed comparison using shingles
  const currentShingles = computeShingles(currentText);
  const previousShingles = computeShingles(previousText);
  const similarity = jaccardSimilarity(currentShingles, previousShingles);

  return {
    hasChanged: similarity < CHANGE_THRESHOLD,
    similarity,
    newHash,
  };
}
