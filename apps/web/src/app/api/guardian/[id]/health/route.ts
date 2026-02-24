import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGuardianLink, updateGuardianLink } from '@linkrescue/database';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: link } = await getGuardianLink(supabase, params.id);
  if (!link || link.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const start = Date.now();
  let statusCode: number | null = null;
  let newStatus: 'active' | 'broken' = 'broken';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(link.original_url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    statusCode = response.status;
    newStatus = response.ok ? 'active' : 'broken';
  } catch {
    // timeout or network error → broken
  }

  const latencyMs = Date.now() - start;

  await updateGuardianLink(supabase, params.id, { status: newStatus });

  return NextResponse.json({ status: newStatus, statusCode, latencyMs });
}
