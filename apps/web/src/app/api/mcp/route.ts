import { NextRequest, NextResponse } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api-auth';

/**
 * Remote MCP endpoint — https://www.linkrescue.io/api/mcp
 *
 * Streamable HTTP, stateless: every request builds a fresh server, so nothing
 * has to survive between serverless invocations. Callers authenticate with the
 * same lr_ API key the REST API uses (free keys included), and every tool calls
 * the matching /api/v1 route with that key — so auth, per-plan rate limits and
 * scan logic live in exactly one place.
 *
 * API errors are returned to the agent as tool errors. Nothing here ever
 * fabricates a result; the stdio package learned that the hard way.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Json = Record<string, unknown>;

function buildServer(origin: string, authorization: string): McpServer {
  const server = new McpServer(
    { name: 'linkrescue', version: '1.0.0' },
    {
      instructions:
        'LinkRescue checks affiliate links for silent tracking failures: links that still load (HTTP 200) ' +
        'but have dropped their affiliate parameters in a redirect chain, so the click earns nothing. ' +
        'Use check_links for a quick check of specific URLs. For a whole site, call start_site_scan, then ' +
        'poll get_scan until status is completed or failed, then get_fix_suggestions. ' +
        'LinkRescue reports exposure (how many links earn nothing when clicked) and never estimates lost ' +
        'revenue — do not invent a dollar figure from its results. If a scan covers few pages, the site may ' +
        'block crawlers: say coverage was partial rather than calling the site healthy.',
    },
  );

  async function callApi(method: 'GET' | 'POST', path: string, body?: Json) {
    const res = await fetch(`${origin}/api/v1${path}`, {
      method,
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON body — pass the raw text through
    }

    if (!res.ok) {
      const reset = res.headers.get('X-RateLimit-Reset');
      const message =
        typeof data === 'object' && data && 'error' in data ? String((data as Json).error) : String(text);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `LinkRescue API error ${res.status}: ${message}${reset ? ` (rate limit resets ${reset})` : ''}`,
          },
        ],
      };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }

  server.registerTool(
    'check_links',
    {
      title: 'Check links',
      description:
        'Follow up to 20 URLs through their redirect chains and report, for each: final status, redirect ' +
        'hops, whether it is an affiliate link, and which affiliate tracking parameters were lost on the way. ' +
        'params_lost being non-empty on a 200 response is the silent failure LinkRescue exists to catch.',
      inputSchema: {
        urls: z.array(z.string().url()).min(1).max(20).describe('Absolute URLs to check (max 20)'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ urls }) => callApi('POST', '/check-links', { urls }),
  );

  server.registerTool(
    'start_site_scan',
    {
      title: 'Start site scan',
      description:
        'Start a crawl of a site already added to the LinkRescue dashboard (free accounts: one site, one ' +
        'scan per day, 200 pages). Returns a scan_id immediately; a full scan takes minutes, so poll get_scan.',
      inputSchema: {
        url: z.string().describe('Site domain or URL, e.g. https://example.com'),
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ url }) => callApi('POST', '/scans', { url }),
  );

  server.registerTool(
    'get_scan',
    {
      title: 'Get scan status and results',
      description:
        'Get a scan by id. While status is pending or running, wait and call again. When completed, returns ' +
        'pages scanned, links checked and the issues found.',
      inputSchema: {
        scan_id: z.string().uuid().describe('scan_id returned by start_site_scan'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ scan_id }) => callApi('GET', `/scans/${encodeURIComponent(scan_id)}`),
  );

  server.registerTool(
    'get_fix_suggestions',
    {
      title: 'Get fix suggestions',
      description:
        'Prioritized repair steps for the issues in a completed scan — for example, replacing a link whose ' +
        'redirect strips the affiliate tag with the merchant-approved tracking URL.',
      inputSchema: {
        scan_id: z.string().uuid().describe('scan_id of a completed scan'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ scan_id }) => callApi('POST', '/suggestions', { scan_id }),
  );

  return server;
}

function unauthorized(message: string, status = 401) {
  return NextResponse.json(
    { jsonrpc: '2.0', error: { code: -32001, message }, id: null },
    {
      status,
      headers: {
        'WWW-Authenticate':
          'Bearer realm="linkrescue", error="invalid_token", error_description="Get a free lr_ API key at https://www.linkrescue.io/signup"',
      },
    },
  );
}

async function handle(req: NextRequest): Promise<Response> {
  const authorization = req.headers.get('authorization') ?? '';
  if (!authorization) {
    return unauthorized(
      'Missing API key. Send "Authorization: Bearer lr_..." — free keys at https://www.linkrescue.io/signup',
    );
  }

  // Reject bad keys up front with a proper 401, rather than letting every
  // tool call fail one at a time after the client thinks it connected.
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return unauthorized(auth.error, auth.status);

  const server = buildServer(req.nextUrl.origin, authorization);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true, // plain JSON — no long-lived SSE stream in a serverless function
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    await server.close();
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function DELETE(req: NextRequest) {
  return handle(req);
}
