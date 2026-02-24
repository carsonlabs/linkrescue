import { NextResponse } from 'next/server';
import { createAdminClient } from '@linkrescue/database';

export async function GET() {
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
