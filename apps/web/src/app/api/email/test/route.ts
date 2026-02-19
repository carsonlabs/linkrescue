import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWeeklyDigest } from '@linkrescue/email';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's first site for test data
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .limit(1);

  const site = sites?.[0];
  const domain = site?.domain || 'example.com';
  const siteId = site?.id || 'test';

  try {
    await sendWeeklyDigest({
      email: user.email,
      domain,
      siteId,
      issues: [
        {
          href: 'https://example.com/broken-link',
          pageUrl: `https://${domain}/blog/post-1`,
          issueType: 'BROKEN_4XX',
          statusCode: 404,
          isAffiliate: true,
        },
        {
          href: 'https://example.com/timeout-link',
          pageUrl: `https://${domain}/blog/post-2`,
          issueType: 'TIMEOUT',
          statusCode: null,
          isAffiliate: false,
        },
      ],
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    return NextResponse.json({ message: 'Test email sent' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
