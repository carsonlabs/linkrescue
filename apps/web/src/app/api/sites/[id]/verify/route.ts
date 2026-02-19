import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (site.verified_at) {
    return NextResponse.json({ message: 'Site already verified' });
  }

  // Fetch homepage and check for meta tag
  try {
    const response = await fetch(`https://${site.domain}`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'LinkRescue-Verifier/1.0' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not reach ${site.domain} (HTTP ${response.status})` },
        { status: 422 }
      );
    }

    const html = await response.text();
    const expectedTag = `<meta name="linkrescue-site-verification" content="${site.verify_token}"`;
    const altExpectedTag = `<meta content="${site.verify_token}" name="linkrescue-site-verification"`;

    if (!html.includes(expectedTag) && !html.includes(altExpectedTag)) {
      return NextResponse.json(
        {
          error: 'Verification meta tag not found. Please add the following to your homepage <head>:',
          tag: `<meta name="linkrescue-site-verification" content="${site.verify_token}" />`,
        },
        { status: 422 }
      );
    }

    // Mark as verified
    const { data: updated, error: updateError } = await supabase
      .from('sites')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Site verified successfully', site: updated });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach ${site.domain}. Make sure the site is accessible.` },
      { status: 422 }
    );
  }
}
