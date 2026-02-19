export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Scan {
  id: string;
  siteId: string;
  status: ScanStatus;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}
