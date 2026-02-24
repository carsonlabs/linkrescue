export type ScanFrequency = 'daily' | 'weekly' | 'monthly';

export interface ScanSchedule {
  id: string;
  site_id: string;
  frequency: ScanFrequency;
  next_run_at: string;
  created_at: string;
  updated_at: string;
}
