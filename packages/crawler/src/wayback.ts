/**
 * Wayback Machine integration for suggesting archived versions of broken links.
 *
 * Uses the free Wayback Availability API:
 * https://archive.org/wayback/available?url=<url>
 */

const WAYBACK_API = 'https://archive.org/wayback/available';
const WAYBACK_TIMEOUT_MS = 5_000;

export interface WaybackResult {
  /** Whether an archived snapshot exists */
  hasArchive: boolean;
  /** URL to the most recent archived snapshot */
  archiveUrl: string | null;
  /** Timestamp of the snapshot (YYYYMMDDHHMMSS format) */
  timestamp: string | null;
}

/**
 * Check if an archived version of a URL exists on the Wayback Machine.
 * Returns the most recent snapshot URL if available.
 *
 * This is called for broken links to suggest an archived fallback.
 * Non-blocking — returns null values on any failure.
 */
export async function checkWaybackArchive(url: string): Promise<WaybackResult> {
  const noResult: WaybackResult = { hasArchive: false, archiveUrl: null, timestamp: null };

  try {
    const apiUrl = `${WAYBACK_API}?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(WAYBACK_TIMEOUT_MS),
      headers: { 'User-Agent': 'LinkRescue/1.0 (+https://linkrescue.io)' },
    });

    if (!response.ok) return noResult;

    const data = (await response.json()) as {
      archived_snapshots?: {
        closest?: {
          available: boolean;
          url: string;
          timestamp: string;
          status: string;
        };
      };
    };

    const snapshot = data.archived_snapshots?.closest;
    if (!snapshot?.available) return noResult;

    return {
      hasArchive: true,
      archiveUrl: snapshot.url,
      timestamp: snapshot.timestamp,
    };
  } catch {
    // Network error, timeout, or parse error — not critical
    return noResult;
  }
}
