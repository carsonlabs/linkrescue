import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { runScan } from '@linkrescue/crawler';
import { createAdminClient } from '@linkrescue/database';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (!site.verified_at) {
    return NextResponse.json({ error: 'Site must be verified before scanning' }, { status: 403 });
  }

  // Check plan limits
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  // Run scan with admin client (bypasses RLS for writes)
  const adminDb = createAdminClient();

  try {
    await runScan({
      siteId: site.id,
      domain: site.domain,
      sitemapUrl: site.sitemap_url,
      maxPages: limits.pagesPerScan,
      supabase: adminDb,
    });

    return NextResponse.json({ message: 'Scan started' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
