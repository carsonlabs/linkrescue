import { sendImmediateAlert } from './immediate-alert';
import type { SupabaseClient } from '@supabase/supabase-js';

interface TriggerAlertParams {
  scanId: string;
  siteId: string;
  supabase: SupabaseClient;
  appUrl: string;
}

export async function triggerImmediateAlert({
  scanId,
  siteId,
  supabase,
  appUrl,
}: TriggerAlertParams) {
  try {
    // Get site and user info
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        domain,
        user:users!inner(email)
      `)
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      console.error('Failed to get site for alert:', siteError);
      return null;
    }

    // Get broken affiliate links from this scan
    const { data: brokenAffiliateLinks, error: linksError } = await supabase
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

    if (linksError) {
      console.error('Failed to get broken links:', linksError);
      return null;
    }

    const brokenLinkCount = brokenAffiliateLinks?.length || 0;

    // Only send if there are broken affiliate links
    if (brokenLinkCount === 0) {
      return { sent: false, reason: 'No broken affiliate links' };
    }

    // Calculate estimated monthly loss
    // Conservative estimate: 100 clicks/month per broken link, 3% conversion, $15 commission
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

    return {
      sent: true,
      brokenLinkCount,
      estimatedMonthlyLoss,
    };

  } catch (error) {
    console.error('Failed to trigger immediate alert:', error);
    return null;
  }
}
