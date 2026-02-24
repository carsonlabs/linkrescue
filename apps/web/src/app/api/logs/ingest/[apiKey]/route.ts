import { NextResponse } from 'next/server';
import { createAdminClient, getAllSourceApiKeyHashes, upsertIncident } from '@linkrescue/database';
import { parseLogBatch } from '@/lib/log-parser';
import bcrypt from 'bcryptjs';
import type { LogFormat } from '@linkrescue/types';

export async function POST(request: Request, { params }: { params: { apiKey: string } }) {
  const adminDb = createAdminClient();

  // Find matching source by bcrypt comparison
  const sources = await getAllSourceApiKeyHashes(adminDb);
  let matchedSource: { id: string; user_id: string } | null = null;

  for (const source of sources) {
    const match = await bcrypt.compare(params.apiKey, source.api_key_hash);
    if (match) {
      matchedSource = source;
      break;
    }
  }

  if (!matchedSource) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Get source format
  const { data: sourceRow } = await adminDb
    .from('log_sources')
    .select('format')
    .eq('id', matchedSource.id)
    .single();

  const format: LogFormat = (sourceRow?.format as LogFormat) ?? 'nginx';
  const body = await request.text();
  const entries = parseLogBatch(body, format);

  let upserted = 0;
  for (const entry of entries) {
    await upsertIncident(adminDb, {
      source_id: matchedSource.id,
      url: entry.url,
      source_page: entry.source_page,
      status_code: entry.status_code,
    });
    upserted++;
  }

  return NextResponse.json({ processed: entries.length, upserted });
}
