import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { createAdminClient, computeNextRunAt, upsertSchedule } from '@linkrescue/database';
import type { ScanFrequency } from '@linkrescue/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function normalizeDomain(rawUrl: string): string | null {
  try {
    const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function mapFrequencyHours(frequencyHours: number): ScanFrequency {
  if (frequencyHours <= 24) return 'daily';
  if (frequencyHours <= 24 * 7) return 'weekly';
  return 'monthly';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/v1/monitors
 *
 * Creates or updates a site's recurring scan schedule using API-key auth.
 * Body: { "url": "https://example.com", "frequency_hours"?: 24 }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: CORS_HEADERS },
    );
  }

  let body: { url?: string; frequency_hours?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const rawUrl = (body.url ?? '').trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: '"url" is required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const domain = normalizeDomain(rawUrl);
  if (!domain) {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const requestedFrequencyHours =
    typeof body.frequency_hours === 'number' && Number.isFinite(body.frequency_hours)
      ? Math.max(1, Math.round(body.frequency_hours))
      : 24;
  const normalizedFrequency = mapFrequencyHours(requestedFrequencyHours);

  const adminDb = createAdminClient();
  const { data: site } = await adminDb
    .from('sites')
    .select('id, domain')
    .eq('user_id', auth.context.userId)
    .eq('domain', domain)
    .maybeSingle();

  if (!site) {
    return NextResponse.json(
      { error: `Site "${domain}" not found in your account. Add it to your dashboard first.` },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const nextRunAt = computeNextRunAt(normalizedFrequency);
  const { data: schedule, error } = await upsertSchedule(
    adminDb,
    site.id,
    normalizedFrequency,
    nextRunAt,
  );

  if (error || !schedule) {
    return NextResponse.json(
      { error: 'Failed to create monitoring schedule' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      monitoring_id: schedule.id,
      site_id: site.id,
      url: `https://${site.domain}`,
      status: 'active',
      frequency_hours: requestedFrequencyHours,
      normalized_frequency: normalizedFrequency,
      next_scan: schedule.next_run_at,
      message:
        requestedFrequencyHours === 24 || requestedFrequencyHours === 24 * 7
          ? `Monitoring set up for ${site.domain} every ${requestedFrequencyHours}h.`
          : `Monitoring set up for ${site.domain} using the nearest supported schedule (${normalizedFrequency}).`,
    },
    { status: 200, headers: CORS_HEADERS },
  );
}
