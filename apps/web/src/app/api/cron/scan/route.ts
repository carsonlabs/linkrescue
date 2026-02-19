import { NextResponse } from 'next/server';
import { runScan } from '@linkrescue/crawler';
import { createAdminClient } from '@linkrescue/database';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';
import { sendWeeklyDigest } from '@linkrescue/email';

export const maxDuration = 300; // 5 minutes for Vercel Pro

const CONCURRENCY_LIMIT = 3;

// This endpoint is triggered by Vercel Cron daily
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all verified sites with their user info.
  // Supabase-js cannot infer !inner join shapes without Relationships in the
  // generated schema type, so we cast to the known runtime shape here.
  type SiteWithUser = {
    id: string;
    user_id: string;
    domain: string;
    sitemap_url: string | null;
    verified_at: string | null;
    created_at: string;
    verify_token: string;
    users: { id: string; stripe_price_id: string | null };
  };
  const { data: sites, error } = (await supabase
    .from('sites')
    .select('*, users!inner(id, stripe_price_id)')
    .not('verified_at', 'is', null)) as unknown as {
    data: SiteWithUser[] | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  if (!sites || sites.length === 0) {
    return NextResponse.json({ message: 'No verified sites to scan' });
  }

  const results: Array<{ domain: string; status: string; error?: string }> = [];

  // Process sites with concurrency limit using simple batching
  for (let i = 0; i < sites.length; i += CONCURRENCY_LIMIT) {
    const batch = sites.slice(i, i + CONCURRENCY_LIMIT);

    const batchResults = await Promise.allSettled(
      batch.map(async (site) => {
        const userProfile = site.users;
        const plan = getUserPlan(userProfile?.stripe_price_id ?? null);
        const limits = getPlanLimits(plan);

        try {
          const scanResult = await runScan({
            siteId: site.id,
            domain: site.domain,
            sitemapUrl: site.sitemap_url,
            maxPages: limits.pagesPerScan,
            supabase,
          });

          // Send weekly digest email
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(site.user_id);
            if (authUser?.user?.email) {
              // Get issues from the latest scan
              const { data: issues } = await supabase
                .from('scan_results')
                .select('*, link:links!inner(href, is_affiliate, page:pages!inner(url))')
                .eq('scan_id', scanResult.scanId)
                .neq('issue_type', 'OK')
                .limit(20);

              if (issues && issues.length > 0) {
                await sendWeeklyDigest({
                  email: authUser.user.email,
                  domain: site.domain,
                  siteId: site.id,
                  issues: issues.map((i: any) => ({
                    href: i.link.href,
                    pageUrl: i.link.page.url,
                    issueType: i.issue_type,
                    statusCode: i.status_code,
                    isAffiliate: i.link.is_affiliate,
                  })),
                  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                });
              }
            }
          } catch (emailErr) {
            console.error(`Failed to send digest for ${site.domain}:`, emailErr);
          }

          return { domain: site.domain, status: 'completed' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { domain: site.domain, status: 'failed', error: message };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ domain: 'unknown', status: 'failed', error: String(result.reason) });
      }
    }
  }

  const succeeded = results.filter((r) => r.status === 'completed').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  return NextResponse.json({
    message: `Scanned ${succeeded} sites, ${failed} failed`,
    results,
  });
}
