import { NextResponse } from 'next/server';
import type { Database } from '@linkrescue/database';
import { createAdminClient } from '@linkrescue/database';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const adminDb = createAdminClient();

  const { data: linkData } = await adminDb
    .from('guardian_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  const link = linkData as Database['public']['Tables']['guardian_links']['Row'] | null;

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fire-and-forget rescue log
  void Promise.resolve(
    adminDb.from('rescue_logs').insert({ guardian_link_id: link.id }),
  ).catch(() => {});

  return NextResponse.redirect(link.backup_url, { status: 302 });
}
