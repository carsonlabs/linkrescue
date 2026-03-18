import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard: env vars may not exist during Vercel build step
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({});
  }

  const { createAdminClient } = await import('@linkrescue/database');
  const adminDb = createAdminClient();

  const { data } = await adminDb
    .from('redirect_rules')
    .select('from_url, to_url')
    .eq('status', 'deployed');

  const map: Record<string, string> = {};
  for (const rule of data ?? []) {
    map[rule.from_url] = rule.to_url;
  }

  return new NextResponse(JSON.stringify(map), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60',
    },
  });
}
