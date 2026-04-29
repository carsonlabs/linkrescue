import { NextResponse } from 'next/server';
import type { Database } from '@linkrescue/database';
import { createAdminClient } from '@linkrescue/database';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
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

  let backup: URL;
  try {
    backup = new URL(link.backup_url);
  } catch {
    return NextResponse.json({ error: 'Invalid backup URL' }, { status: 400 });
  }
  if (backup.protocol !== 'http:' && backup.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported URL scheme' }, { status: 400 });
  }

  // Phishing safeguard: if the destination is off-domain and the request did
  // not come from the interstitial page, bounce to /rescue/[slug] so the user
  // sees where they're about to land. Same-domain hops auto-redirect since
  // the link owner controls both ends.
  const reqUrl = new URL(req.url);
  const confirmed = reqUrl.searchParams.get('confirmed') === '1';
  const sameDomain = reqUrl.hostname === backup.hostname;

  if (!confirmed && !sameDomain) {
    const interstitial = new URL(`/rescue/${params.slug}`, reqUrl.origin);
    return NextResponse.redirect(interstitial.toString(), { status: 302 });
  }

  void Promise.resolve(
    adminDb.from('rescue_logs').insert({ guardian_link_id: link.id }),
  ).catch(() => {});

  return NextResponse.redirect(backup.toString(), { status: 302 });
}
