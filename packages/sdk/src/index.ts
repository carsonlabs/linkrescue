/**
 * @linkrescue/sdk — Official Node.js/TypeScript SDK for the LinkRescue API
 *
 * @example
 * ```ts
 * import { LinkRescue } from '@linkrescue/sdk';
 *
 * const lr = new LinkRescue('lr_your_api_key');
 * const { results } = await lr.checkLinks(['https://amzn.to/abc123']);
 * ```
 */

// ── Types ──────────────────────────────────────────────────────────

export interface LinkResult {
  url: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  status_code: number;
  final_url: string;
  redirect_count: number;
  is_affiliate: boolean;
  affiliate_params_preserved: boolean | null;
  params_lost: string[];
  issue: string | null;
}

export interface CheckLinksResponse {
  checked: number;
  summary: {
    broken: number;
    redirects: number;
    params_lost: number;
  };
  results: LinkResult[];
}

export interface ScanSubmitResponse {
  scan_id: string;
  status: 'pending';
  domain: string;
  poll_url: string;
  estimated_seconds: number;
}

export interface ScanStatusResponse {
  scan_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  domain?: string;
  pages_scanned?: number;
  links_checked?: number;
  issue_count?: number;
  issues?: Array<{
    url: string;
    status_code: number;
    issue_type: string;
    is_affiliate: boolean;
  }>;
  error_message?: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface LinkRescueOptions {
  /** Base URL for the API. Defaults to https://app.linkrescue.io */
  baseUrl?: string;
  /** Request timeout in ms. Defaults to 30000 */
  timeout?: number;
}

export class LinkRescueError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'LinkRescueError';
  }
}

// ── Client ─────────────────────────────────────────────────────────

export class LinkRescue {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiKey: string, options: LinkRescueOptions = {}) {
    if (!apiKey || !apiKey.startsWith('lr_')) {
      throw new Error('Invalid API key. Keys start with "lr_". Get one at https://linkrescue.io');
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://app.linkrescue.io').replace(/\/$/, '');
    this.timeout = options.timeout ?? 30_000;
  }

  // ── Check Links ────────────────────────────────────────────────

  /**
   * Check one or more URLs for broken links, redirect chains, and affiliate parameter survival.
   * Max 20 URLs per request. For more, the SDK batches automatically.
   */
  async checkLinks(urls: string[]): Promise<CheckLinksResponse> {
    if (urls.length === 0) {
      return { checked: 0, summary: { broken: 0, redirects: 0, params_lost: 0 }, results: [] };
    }

    // Batch in groups of 20
    if (urls.length <= 20) {
      return this.request<CheckLinksResponse>('POST', '/api/v1/check-links', { urls });
    }

    const allResults: LinkResult[] = [];
    let totalBroken = 0;
    let totalRedirects = 0;
    let totalParamsLost = 0;

    for (let i = 0; i < urls.length; i += 20) {
      const batch = urls.slice(i, i + 20);
      const data = await this.request<CheckLinksResponse>('POST', '/api/v1/check-links', {
        urls: batch,
      });
      allResults.push(...data.results);
      totalBroken += data.summary.broken;
      totalRedirects += data.summary.redirects;
      totalParamsLost += data.summary.params_lost;
    }

    return {
      checked: allResults.length,
      summary: { broken: totalBroken, redirects: totalRedirects, params_lost: totalParamsLost },
      results: allResults,
    };
  }

  /**
   * Check a single URL. Convenience wrapper around checkLinks.
   */
  async checkLink(url: string): Promise<LinkResult> {
    const { results } = await this.checkLinks([url]);
    return results[0];
  }

  // ── Site Scans (Agency) ────────────────────────────────────────

  /**
   * Submit an async site scan. Returns a scan ID to poll.
   */
  async submitScan(
    url: string,
    options?: { webhookUrl?: string },
  ): Promise<ScanSubmitResponse> {
    return this.request<ScanSubmitResponse>('POST', '/api/v1/scans', {
      url,
      webhook_url: options?.webhookUrl,
    });
  }

  /**
   * Get the status/results of a scan.
   */
  async getScan(scanId: string): Promise<ScanStatusResponse> {
    return this.request<ScanStatusResponse>('GET', `/api/v1/scans/${scanId}`);
  }

  /**
   * Submit a scan and poll until completion.
   * @param pollIntervalMs - How often to poll (default 5000ms)
   * @param maxWaitMs - Maximum wait time (default 300000ms / 5 min)
   */
  async scanAndWait(
    url: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number; webhookUrl?: string },
  ): Promise<ScanStatusResponse> {
    const { pollIntervalMs = 5000, maxWaitMs = 300_000, webhookUrl } = options ?? {};

    const { scan_id } = await this.submitScan(url, { webhookUrl });
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const status = await this.getScan(scan_id);
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
    }

    throw new LinkRescueError('Scan timed out waiting for completion', 408);
  }

  // ── API Keys ───────────────────────────────────────────────────

  /**
   * List your API keys (metadata only, not the full key).
   */
  async listKeys(): Promise<ApiKeyInfo[]> {
    const data = await this.request<{ keys: ApiKeyInfo[] }>('GET', '/api/v1/keys');
    return data.keys;
  }

  // ── Internal ───────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }
      const message =
        typeof errorBody === 'object' && errorBody && 'error' in errorBody
          ? (errorBody as { error: string }).error
          : `API error ${res.status}`;
      throw new LinkRescueError(message, res.status, errorBody);
    }

    return res.json() as Promise<T>;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Default export for convenience
export default LinkRescue;
