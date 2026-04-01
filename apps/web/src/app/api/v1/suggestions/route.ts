import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { createAdminClient } from '@linkrescue/database';
import type { IssueType } from '@linkrescue/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type BrokenLinkInput = {
  id?: string;
  url?: string;
  status_code?: number | null;
  issue_type?: string | null;
  final_url?: string | null;
  is_affiliate?: boolean;
  anchor_text?: string | null;
  found_on?: string | null;
  seo_impact?: string | null;
};

type OfferMatchSummary = {
  title: string;
  url: string;
  score: number;
  reason: string;
};

function inferPriority(link: BrokenLinkInput): 'high' | 'medium' | 'low' {
  if (link.seo_impact === 'high' || link.is_affiliate) return 'high';
  if (
    link.issue_type === 'BROKEN_4XX' ||
    link.issue_type === 'SERVER_5XX' ||
    link.issue_type === 'LOST_PARAMS'
  ) {
    return 'medium';
  }
  return 'low';
}

function inferIssueType(link: BrokenLinkInput): string {
  if (link.issue_type) return link.issue_type;
  if (link.status_code == null) return 'TIMEOUT';
  if (link.status_code >= 500) return 'SERVER_5XX';
  if (link.status_code >= 400) return 'BROKEN_4XX';
  return 'UNKNOWN';
}

function buildSuggestion(link: BrokenLinkInput, offerMatches: OfferMatchSummary[] = []) {
  const brokenUrl = link.url ?? '';
  const priority = inferPriority(link);
  const issueType = inferIssueType(link);
  const statusCode = link.status_code ?? 0;

  let action = 'remove_or_replace';
  let detail = 'Review the destination and replace it with a working alternative.';
  let codeSnippet: string | undefined;

  switch (issueType) {
    case 'LOST_PARAMS':
      action = 'restore_affiliate_parameters';
      detail =
        'The destination still resolves, but affiliate tracking parameters were stripped. Update the link to the merchant-approved tracking URL and verify params survive the redirect chain.';
      codeSnippet = `<a href="NEW_AFFILIATE_URL" rel="nofollow sponsored">${link.anchor_text ?? 'Link'}</a>`;
      break;
    case 'REDIRECT_TO_HOME':
      action = 'replace_deep_link';
      detail =
        'This link now redirects to a homepage instead of the intended offer. Replace it with a fresh deep link to the exact product or landing page.';
      break;
    case 'SERVER_5XX':
      action = 'retry_or_replace';
      detail =
        'The merchant destination is returning a server error. Re-check it soon; if the failure persists, swap in an alternative destination.';
      break;
    case 'TIMEOUT':
      action = 'recheck_timeout';
      detail =
        'The destination timed out. Confirm whether the merchant is temporarily unavailable or blocking bots, then replace the link if the timeout persists.';
      break;
    case 'BROKEN_4XX':
      action = link.is_affiliate ? 'update_affiliate_link' : 'remove_or_replace';
      detail = link.is_affiliate
        ? 'This affiliate destination is dead. Update it to the current merchant link or replace it with a comparable offer.'
        : 'This destination returns a client error. Remove the link or update it to a valid URL.';
      codeSnippet = link.is_affiliate
        ? `<a href="NEW_AFFILIATE_URL" rel="nofollow sponsored">${link.anchor_text ?? 'Link'}</a>`
        : undefined;
      break;
  }

  if (offerMatches.length > 0) {
    detail += ` Top replacement candidate: ${offerMatches[0].title}.`;
  }

  return {
    broken_url: brokenUrl,
    status_code: statusCode,
    issue_type: issueType,
    priority,
    action,
    detail,
    found_on: link.found_on ?? null,
    replacement_offers: offerMatches,
    code_snippet: codeSnippet,
  };
}

async function loadScanSuggestions(userId: string, scanId: string) {
  const adminDb = createAdminClient();

  const { data: scan } = await adminDb
    .from('scans')
    .select('id, site:sites!inner(user_id)')
    .eq('id', scanId)
    .maybeSingle();

  if (!scan || (scan.site as { user_id: string }).user_id !== userId) {
    return { error: 'Scan not found', status: 404 as const };
  }

  const { data: results } = await adminDb
    .from('scan_results')
    .select(`
      id,
      status_code,
      final_url,
      issue_type,
      redirect_hops,
      links!inner(href, is_affiliate),
      matches(match_score, match_reason, offers(title, url))
    `)
    .eq('scan_id', scanId)
    .neq('issue_type', 'OK')
    .limit(500);

  const suggestions = (results ?? []).map((result) => {
    const link = result.links as { href: string; is_affiliate: boolean };
    const matches = Array.isArray(result.matches)
      ? result.matches
          .map((match) => {
            const offer = match.offers as { title: string; url: string } | null;
            if (!offer) return null;
            return {
              title: offer.title,
              url: offer.url,
              score: match.match_score,
              reason: match.match_reason,
            };
          })
          .filter((match): match is OfferMatchSummary => match !== null)
          .sort((a, b) => b.score - a.score)
      : [];

    return buildSuggestion(
      {
        id: result.id,
        url: link.href,
        status_code: result.status_code,
        issue_type: result.issue_type as IssueType,
        final_url: result.final_url,
        is_affiliate: link.is_affiliate,
      },
      matches,
    );
  });

  return { suggestions };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/v1/suggestions
 *
 * Accepts either:
 * - { "scan_id": "..." } for persisted product scan results
 * - { "broken_links": [...] } for external report payloads
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: CORS_HEADERS },
    );
  }

  let body: { scan_id?: string; broken_links?: BrokenLinkInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  let suggestions:
    | ReturnType<typeof buildSuggestion>[]
    | undefined;

  if (body.scan_id) {
    const result = await loadScanSuggestions(auth.context.userId, body.scan_id);
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: CORS_HEADERS },
      );
    }
    suggestions = result.suggestions;
  } else if (Array.isArray(body.broken_links)) {
    suggestions = body.broken_links.map((link) => buildSuggestion(link));
  } else {
    return NextResponse.json(
      { error: 'Provide either "scan_id" or "broken_links"' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      suggestions,
      total: suggestions.length,
      high_priority: suggestions.filter((s) => s.priority === 'high').length,
    },
    { status: 200, headers: CORS_HEADERS },
  );
}
