export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type IssueType = 'OK' | 'BROKEN_4XX' | 'SERVER_5XX' | 'TIMEOUT' | 'REDIRECT_TO_HOME' | 'LOST_PARAMS' | 'SOFT_404' | 'CONTENT_CHANGED';

export interface Scan {
  id: string;
  site_id: string;
  status: ScanStatus;
  started_at: string | null;
  finished_at: string | null;
  pages_scanned: number;
  links_checked: number;
  error_message: string | null;
  created_at: string;
}

export interface ScanResult {
  id: string;
  scan_id: string;
  link_id: string;
  status_code: number | null;
  final_url: string | null;
  redirect_hops: number;
  issue_type: IssueType;
  checked_at: string;
}

export interface ScanEvent {
  id: number;
  scan_id: string;
  level: string;
  message: string;
  created_at: string;
}
