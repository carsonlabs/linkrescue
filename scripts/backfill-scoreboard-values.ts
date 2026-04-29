#!/usr/bin/env tsx
/**
 * Backfill estimated_value_cents on existing scan_results rows.
 *
 * Idempotent — only updates rows where estimated_value_cents = 0 AND issue_type <> 'OK'.
 * Safe to run repeatedly. Drops zero-value (OK) rows and computes per-row using the
 * value-estimator with the user's current tier.
 *
 * Logic is inlined (not imported from @linkrescue/types) so this script can run
 * standalone against the workspace without a package.json wrapper.
 *
 * Usage:
 *   node --env-file=apps/web/.env.local --import tsx scripts/backfill-scoreboard-values.ts
 *   node --env-file=apps/web/.env.local --import tsx scripts/backfill-scoreboard-values.ts <user_id>
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STRIPE_PRO_MONTHLY_PRICE_ID / STRIPE_PRO_PRICE_ID  (optional — for tier lookup)
 *   STRIPE_AGENCY_MONTHLY_PRICE_ID / STRIPE_AGENCY_PRICE_ID  (optional)
 */

import { createClient } from '@supabase/supabase-js';

// ───── Inlined value estimator (matches @linkrescue/types/scoreboard.ts) ─────

type EstimatorTier = 'free' | 'pro' | 'agency';
type IssueTypeKey =
  | 'OK'
  | 'BROKEN_4XX'
  | 'SERVER_5XX'
  | 'TIMEOUT'
  | 'REDIRECT_TO_HOME'
  | 'LOST_PARAMS'
  | 'SOFT_404'
  | 'CONTENT_CHANGED';

const TIER_BASE_VALUE_CENTS: Record<EstimatorTier, number> = {
  free: 500,
  pro: 1000,
  agency: 1500,
};

const ISSUE_TYPE_MULTIPLIER: Record<IssueTypeKey, number> = {
  OK: 0,
  BROKEN_4XX: 1.0,
  SERVER_5XX: 1.0,
  SOFT_404: 0.9,
  REDIRECT_TO_HOME: 0.7,
  TIMEOUT: 0.6,
  LOST_PARAMS: 0.8,
  CONTENT_CHANGED: 0.4,
};

const AFFILIATE_BONUS = 1.25;

function estimateValueCents(args: {
  tier: EstimatorTier;
  issueType: IssueTypeKey;
  isAffiliate?: boolean;
}): number {
  const { tier, issueType, isAffiliate = false } = args;
  if (issueType === 'OK') return 0;
  const base = TIER_BASE_VALUE_CENTS[tier];
  const issueMult = ISSUE_TYPE_MULTIPLIER[issueType] ?? 0.5;
  const affiliateMult = isAffiliate ? AFFILIATE_BONUS : 1.0;
  return Math.round(base * issueMult * affiliateMult);
}

function getUserPlan(stripePriceId: string | null): EstimatorTier {
  if (!stripePriceId) return 'free';
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || '';
  const proAnnual = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '';
  const agencyMonthly = process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID || process.env.STRIPE_AGENCY_PRICE_ID || '';
  const agencyAnnual = process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID || '';
  if (stripePriceId === agencyMonthly || stripePriceId === agencyAnnual) return 'agency';
  if (stripePriceId === proMonthly || stripePriceId === proAnnual) return 'pro';
  return 'pro'; // unknown active price → assume pro
}

// ───────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 500;

async function backfillForUser(userId: string): Promise<{ rows: number; cents: number }> {
  console.log(`  → ${userId.slice(0, 8)}: fetching profile`);
  const { data: profile, error: pErr } = await db
    .from('users')
    .select('stripe_price_id')
    .eq('id', userId)
    .maybeSingle();
  if (pErr) {
    console.error(`  profile error:`, JSON.stringify(pErr));
    throw pErr;
  }

  const tier = getUserPlan(profile?.stripe_price_id ?? null);
  console.log(`  → tier=${tier}, fetching sites`);

  const { data: sites, error: sErr } = await db.from('sites').select('id').eq('user_id', userId);
  if (sErr) {
    console.error(`  sites error:`, JSON.stringify(sErr));
    throw sErr;
  }
  const siteIds = (sites ?? []).map((s) => s.id);
  console.log(`  → ${siteIds.length} sites`);
  if (siteIds.length === 0) return { rows: 0, cents: 0 };

  const { data: scans, error: scErr } = await db.from('scans').select('id').in('site_id', siteIds);
  if (scErr) {
    console.error(`  scans error:`, JSON.stringify(scErr));
    throw scErr;
  }
  const scanIds = (scans ?? []).map((s) => s.id);
  console.log(`  → ${scanIds.length} scans`);
  if (scanIds.length === 0) return { rows: 0, cents: 0 };

  let totalRows = 0;
  let totalCents = 0;

  // PostgREST has a URL length cap. Chunk scan_ids so the IN-list
  // doesn't blow past it. 100 ids per chunk is comfortably safe.
  const SCAN_ID_CHUNK = 100;

  for (let chunkStart = 0; chunkStart < scanIds.length; chunkStart += SCAN_ID_CHUNK) {
    const chunk = scanIds.slice(chunkStart, chunkStart + SCAN_ID_CHUNK);
    let offset = 0;

    while (true) {
      const { data: results, error } = await db
        .from('scan_results')
        .select('id, issue_type, link_id, estimated_value_cents')
        .in('scan_id', chunk)
        .neq('issue_type', 'OK')
        .eq('estimated_value_cents', 0)
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error(`  scan_results error (chunk ${chunkStart}):`, JSON.stringify(error));
        throw error;
      }
      if (!results || results.length === 0) break;

      const linkIds = Array.from(new Set(results.map((r) => r.link_id)));
      // Chunk link_ids too in case there are many.
      const affiliateMap = new Map<string, boolean>();
      for (let i = 0; i < linkIds.length; i += SCAN_ID_CHUNK) {
        const lc = linkIds.slice(i, i + SCAN_ID_CHUNK);
        const { data: links } = await db
          .from('links')
          .select('id, is_affiliate')
          .in('id', lc);
        for (const l of links ?? []) affiliateMap.set(l.id, l.is_affiliate ?? false);
      }

      for (const row of results) {
        const cents = estimateValueCents({
          tier,
          issueType: row.issue_type as IssueTypeKey,
          isAffiliate: affiliateMap.get(row.link_id) ?? false,
        });
        if (cents === 0) continue;

        const { error: updateError } = await db
          .from('scan_results')
          .update({ estimated_value_cents: cents })
          .eq('id', row.id);
        if (updateError) {
          console.error(`  ✗ Failed to update ${row.id}: ${updateError.message}`);
          continue;
        }
        totalRows++;
        totalCents += cents;
      }

      if (results.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }
  }

  return { rows: totalRows, cents: totalCents };
}

async function main() {
  const targetUserId = process.argv[2];

  let userIds: string[];
  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const { data: users, error } = await db.from('users').select('id');
    if (error) throw error;
    userIds = (users ?? []).map((u) => u.id);
  }

  console.log(`Backfilling scoreboard values for ${userIds.length} user(s)...\n`);

  let grandRows = 0;
  let grandCents = 0;
  for (const uid of userIds) {
    const { rows, cents } = await backfillForUser(uid);
    if (rows > 0) {
      console.log(`  user ${uid.slice(0, 8)}…: ${rows} rows updated, $${(cents / 100).toFixed(2)} estimated`);
    }
    grandRows += rows;
    grandCents += cents;
  }

  console.log(`\nDone. ${grandRows} rows updated. $${(grandCents / 100).toFixed(2)} total value backfilled.`);
}

main().catch((err) => {
  console.error('Backfill failed:');
  console.error('  message:', err?.message);
  console.error('  code:', err?.code);
  console.error('  details:', err?.details);
  console.error('  hint:', err?.hint);
  console.error('  full:', JSON.stringify(err, null, 2));
  process.exit(1);
});
