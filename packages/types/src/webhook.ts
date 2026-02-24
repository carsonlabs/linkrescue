export type WebhookEvent =
  | 'scan.completed'
  | 'scan.failed'
  | 'guardian.rescued'
  | 'redirect.deployed'
  | 'redirect.rollback';

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  last_triggered_at: string | null;
  created_at: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}
