export type LinkStatus = 'ok' | 'broken' | 'redirected' | 'unknown';

export interface Link {
  id: string;
  pageId: string;
  url: string;
  status: LinkStatus;
  httpCode: number | null;
  redirectUrl: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}
