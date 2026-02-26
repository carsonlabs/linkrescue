import { createClient } from '@/lib/supabase/server';
import { sendWeeklyDigest } from '@linkrescue/email';
import { NextResponse } from 'next/server';

// This endpoint triggers weekly digest emails for all users
// Should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkrescue.io';

  try {
    // Get all users with verified sites
    const { data: usersWithSites, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        sites:sites!inner(
          id,
          domain,
          verified_at
        )
      `)
      .not('sites.verified_at', 'is', null);

    if (usersError) {
      throw usersError;
    }

    const results = [];

    // For each user, get their latest scan results and send digest
    for (const user of usersWithSites || []) {
      for (const site of user.sites) {
        // Get latest scan for this site
        const { data: latestScan } = await supabase
          .from('scans')
          .select('id')
          .eq('site_id', site.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestScan) continue;

        // Get issues from latest scan
        const { data: issues } = await supabase
          .from('scan_results')
          .select(`
            issue_type,
            status_code,
            link:links!inner(
              href,
              is_affiliate,
              page:pages!inner(url)
            )
          `)
          .eq('scan_id', latestScan.id)
          .neq('issue_type', 'OK');

        if (!issues || issues.length === 0) continue;

        // Format issues for email
        const formattedIssues = issues.map((issue: any) => ({
          href: issue.link.href,
          pageUrl: issue.link.page?.url || '',
          issueType: issue.issue_type,
          statusCode: issue.status_code,
          isAffiliate: issue.link.is_affiliate,
        }));

        // Send the digest
        try {
          await sendWeeklyDigest({
            email: user.email,
            domain: site.domain,
            siteId: site.id,
            issues: formattedIssues,
            appUrl,
          });

          results.push({
            user: user.email,
            site: site.domain,
            issues: formattedIssues.length,
            status: 'sent',
          });
        } catch (error) {
          results.push({
            user: user.email,
            site: site.domain,
            issues: formattedIssues.length,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length,
      details: results,
    });

  } catch (error) {
    console.error('Failed to send weekly digests:', error);
    return NextResponse.json(
      { error: 'Failed to send digests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
