import { createClient } from '@/lib/supabase/server';
import { sendImmediateAlert } from '@linkrescue/email';
import { NextResponse } from 'next/server';

// This endpoint is called internally when a scan completes
// to send immediate alerts for critical issues
export async function POST(request: Request) {
  const { scanId, siteId } = await request.json();

  if (!scanId || !siteId) {
    return NextResponse.json({ error: 'Missing scanId or siteId' }, { status: 400 });
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkrescue.io';

  try {
    // Get site and user info
    const { data: site } = await supabase
      .from('sites')
      .select(`
        domain,
        user:users!inner(email)
      `)
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check user's notification preferences
    // For now, we'll assume all users want immediate alerts for broken affiliate links
    // TODO: Add user preference check when settings table is updated

    // Get broken affiliate links from this scan
    const { data: brokenAffiliateLinks } = await supabase
      .from('scan_results')
      .select(`
        id,
        link:links!inner(
          is_affiliate
        )
      `)
      .eq('scan_id', scanId)
      .neq('issue_type', 'OK')
      .eq('links.is_affiliate', true);

    const brokenLinkCount = brokenAffiliateLinks?.length || 0;

    // Only send if there are broken affiliate links
    if (brokenLinkCount === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No broken affiliate links found, no alert sent' 
      });
    }

    // Calculate estimated monthly loss
    // Conservative: assume 100 clicks/month per broken link, 3% conversion, $15 commission
    const avgClicksPerLink = 100;
    const avgConversionRate = 0.03;
    const avgCommission = 15;
    const estimatedMonthlyLoss = brokenLinkCount * avgClicksPerLink * avgConversionRate * avgCommission;

    // Send immediate alert
    await sendImmediateAlert({
      email: site.user.email,
      domain: site.domain,
      siteId,
      brokenLinkCount,
      estimatedMonthlyLoss,
      appUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Alert sent for ${brokenLinkCount} broken links`,
      estimatedMonthlyLoss,
    });

  } catch (error) {
    console.error('Failed to send immediate alert:', error);
    return NextResponse.json(
      { error: 'Failed to send alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
