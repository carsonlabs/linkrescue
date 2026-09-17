import { createAdminClient, getNetworkStatsPublic } from '@linkrescue/database';
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

  // Do not invent revenue claims while the network does not have enough verified data.
  const protectedSites = stats?.protected_sites ?? 0;

  // Below threshold, explain the product without implying a customer outcome.
  if (protectedSites < 3) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-slate-300">
          Find broken affiliate links and tracking-parameter failures across your content archive.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-slate-300">
          <span className="font-semibold text-green-400">{protectedSites.toLocaleString()}</span>{' '}
          {protectedSites === 1 ? 'site' : 'sites'} monitored in the LinkRescue network.
      </span>
    </div>
  );
}
