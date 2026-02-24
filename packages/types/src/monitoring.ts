export type LogFormat = 'nginx' | 'apache' | 'cloudflare' | 'custom_json';

export interface LogSource {
  id: string;
  user_id: string;
  name: string;
  format: LogFormat;
  api_key_hash: string;
  created_at: string;
}

export interface LinkIncident {
  id: string;
  source_id: string;
  url: string;
  source_page: string | null;
  status_code: number;
  hits: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface ParsedLogEntry {
  url: string;
  source_page: string | null;
  status_code: number;
}
