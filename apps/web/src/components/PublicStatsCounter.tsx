import { createAdminClient, getNetworkStatsPublic, formatCentsCompact } from '@linkrescue/database';
import { Shield } from 'lucide-react';

/**
 * Live network stats — drops into the homepage hero.
 * Server-rendered with ISR (1h) so we don't ping Supabase on every request.
 */
export const revalidate = 3600;

export async function PublicStatsCounter() {
  let stats: Awaited<ReturnType<typeof getNetworkStatsPublic>> = null;
  try {
    const db = createAdminClient();
    stats = await getNetworkStatsPublic(db);
  } catch {
    stats = null;
  }

  // While we're early — show the punchy fallback the user already had,
  // but in the network frame so the messaging stays consistent.
  const protectedCents = stats?.total_revenue_protected_cents ?? 0;
  const protectedSites = stats?.protected_sites ?? 0;

  // Below threshold: keep the leading "the average affiliate site loses..." stat
  // so the hero doesn't look empty in the first few weeks.
  if (protectedCents < 50000 || protectedSites < 3) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-slate-300">
          The average affiliate site loses{' '}
          <span className="font-semibold text-red-400">$1,200/month</span>{' '}
          to broken links and stripped tracking parameters.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
      <span className="text-slate-300">
        <span className="font-semibold text-green-400">
          {formatCentsCompact(protectedCents)}
        </span>{' '}
        in affiliate commissions protected across{' '}
        <span className="font-semibold text-white">{protectedSites.toLocaleString()}</span>{' '}
        {protectedSites === 1 ? 'site' : 'sites'} and counting.
      </span>
    </div>
  );
}
