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

  // Minimum bar: only http(s) absolute URLs, no javascript:/data:/file: smuggling.
  // The link owner chose this URL, but /rescue/[slug] is public — phishing risk
  // if we blindly 302 anywhere. Future work: serve an interstitial page that
  // shows the destination and requires a click-through for off-domain targets.
  let backup: URL;
  try {
    backup = new URL(link.backup_url);
  } catch {
    return NextResponse.json({ error: 'Invalid backup URL' }, { status: 400 });
  }
  if (backup.protocol !== 'http:' && backup.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported URL scheme' }, { status: 400 });
  }

  void Promise.resolve(
    adminDb.from('rescue_logs').insert({ guardian_link_id: link.id }),
  ).catch(() => {});

  return NextResponse.redirect(backup.toString(), { status: 302 });
}
