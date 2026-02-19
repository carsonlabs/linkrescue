import * as cheerio from 'cheerio';

export interface LinkCheckResult {
  pageUrl: string;
  linkUrl: string;
  status: 'ok' | 'broken' | 'redirected' | 'unknown';
  httpCode: number | null;
  redirectUrl: string | null;
}

export async function checkLinks(pageUrls: string[], domain: string): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];

  for (const pageUrl of pageUrls) {
    try {
      const response = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract all outbound links
      const links = $('a[href]')
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter((href) => href && (href.startsWith('http://') || href.startsWith('https://')));

      // Check each link
      for (const linkUrl of links) {
        const checkResult = await checkLink(linkUrl);
        results.push({
          pageUrl,
          linkUrl,
          ...checkResult,
        });
      }
    } catch (error) {
      console.error(`Failed to check links on ${pageUrl}:`, error);
    }
  }

  return results;
}

async function checkLink(
  url: string
): Promise<{ status: 'ok' | 'broken' | 'redirected' | 'unknown'; httpCode: number | null; redirectUrl: string | null }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });

    const httpCode = response.status;

    if (httpCode >= 200 && httpCode < 300) {
      return { status: 'ok', httpCode, redirectUrl: null };
    } else if (httpCode >= 300 && httpCode < 400) {
      const redirectUrl = response.headers.get('location');
      return { status: 'redirected', httpCode, redirectUrl };
    } else if (httpCode >= 400) {
      return { status: 'broken', httpCode, redirectUrl: null };
    }

    return { status: 'unknown', httpCode, redirectUrl: null };
  } catch (error) {
    console.error(`Failed to check link ${url}:`, error);
    return { status: 'broken', httpCode: null, redirectUrl: null };
  }
}
