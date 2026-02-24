import type { Database, ScanFrequency } from '../schema';

type ScheduleInsert = Database['public']['Tables']['scan_schedules']['Insert'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getScheduleBySite(supabase: any, siteId: string) {
  return supabase.from('scan_schedules').select('*').eq('site_id', siteId).single();
}

export async function upsertSchedule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  siteId: string,
  frequency: ScanFrequency,
  nextRunAt: string,
) {
  return supabase
    .from('scan_schedules')
    .upsert(
      { site_id: siteId, frequency, next_run_at: nextRunAt, updated_at: new Date().toISOString() },
      { onConflict: 'site_id' },
    )
    .select()
    .single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteSchedule(supabase: any, siteId: string) {
  return supabase.from('scan_schedules').delete().eq('site_id', siteId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDueSchedules(supabase: any) {
  return supabase
    .from('scan_schedules')
    .select('*, sites(*)')
    .lte('next_run_at', new Date().toISOString());
}

export function computeNextRunAt(frequency: ScanFrequency, from: Date = new Date()): string {
  const next = new Date(from);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next.toISOString();
}
