import { describe, expect, it, vi } from 'vitest';
import { getNetworkStatsPublic } from '@linkrescue/database';

function databaseReturning(error: { code: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
  const select = vi.fn(() => ({ maybeSingle }));
  const from = vi.fn(() => ({ select }));

  return { database: { from }, from };
}

describe('getNetworkStatsPublic', () => {
  it.each(['42P01', 'PGRST205'])('fails soft when the stats view is unavailable (%s)', async (code) => {
    const { database, from } = databaseReturning({ code });

    await expect(getNetworkStatsPublic(database as never)).resolves.toBeNull();
    expect(from).toHaveBeenCalledWith('network_stats_public');
  });

  it('surfaces unexpected database errors', async () => {
    const error = { code: '42501' };
    const { database } = databaseReturning(error);

    await expect(getNetworkStatsPublic(database as never)).rejects.toBe(error);
  });
});
