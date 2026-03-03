import { NextRequest, NextResponse } from 'next/server';
import { BROWSER_ENVIRONMENTS } from '@/config/browser-environments';

/**
 * Layer B proxy — forwards link check requests to the VPS Playwright API
 * and returns real browser-tested results.
 *
 * POST /api/check-link/browser
 * Body: { url: string }
 */

/* ------------------------------------------------------------------ */
/*  Rate limiter (stricter than Layer A — browser tests are expensive) */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // per hour
const RATE_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const BROWSER_API_URL = process.env.BROWSER_API_URL;
  const BROWSER_API_KEY = process.env.BROWSER_API_KEY;

  if (!BROWSER_API_URL || !BROWSER_API_KEY) {
    return NextResponse.json(
      { error: 'Browser testing is not configured', available: false },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: "You've used your browser test checks for this hour. Create a free account for more.",
        rateLimited: true,
      },
      { status: 429 },
    );
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawUrl = (body.url ?? '').trim();
  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const urlStr = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout for browser tests

    const res = await fetch(`${BROWSER_API_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BROWSER_API_KEY,
      },
      body: JSON.stringify({
        url: urlStr,
        environments: BROWSER_ENVIRONMENTS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'VPS error' }));
      return NextResponse.json(
        { error: err.error ?? 'Browser test service error', available: false },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ ...data, available: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('abort')) {
      return NextResponse.json(
        { error: 'Browser test timed out', available: false },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: 'Browser test service unavailable', available: false },
      { status: 502 },
    );
  }
}
