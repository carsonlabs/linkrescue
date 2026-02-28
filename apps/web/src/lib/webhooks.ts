import crypto from 'crypto';
import { createAdminClient, getWebhooksForEvent, touchWebhook, type Database } from '@linkrescue/database';
import type { WebhookEvent, WebhookPayload } from '@linkrescue/types';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [0, 60_000, 300_000]; // immediate, 1min, 5min

type WebhookRow = Database['public']['Tables']['webhooks']['Row'];

/**
 * Sign a webhook payload with HMAC-SHA256
 */
function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Deliver a single webhook request
 */
async function deliver(
  url: string,
  secret: string,
  body: string,
  event: string,
  deliveryId: string,
): Promise<{ success: boolean; statusCode?: number; responseBody?: string }> {
  const signature = signPayload(body, secret);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LinkRescue-Signature': `sha256=${signature}`,
        'X-LinkRescue-Event': event,
        'X-LinkRescue-Delivery': deliveryId,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseBody = await res.text().catch(() => '');
    return { success: res.ok, statusCode: res.status, responseBody: responseBody.slice(0, 1000) };
  } catch (err) {
    return { success: false, responseBody: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Fire webhooks for a specific event for a user.
 * Creates delivery records and attempts immediate delivery with retry scheduling.
 */
export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const adminDb = createAdminClient();
  const hooks = await getWebhooksForEvent(adminDb, userId, event);

  if (!hooks || hooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    hooks.map(async (hook: WebhookRow) => {
      // Create delivery record (table not yet in generated schema, use rpc-style insert)
      const deliveryId = crypto.randomUUID();
      await (adminDb as any).from('webhook_deliveries').insert({
        id: deliveryId,
        webhook_id: hook.id,
        event,
        payload,
        status: 'pending',
        attempts: 1,
      });

      const result = await deliver(hook.url, hook.secret, body, event, deliveryId);

      if (result.success) {
        await (adminDb as any).from('webhook_deliveries').update({
          status: 'success',
          status_code: result.statusCode,
          response_body: result.responseBody,
          delivered_at: new Date().toISOString(),
        }).eq('id', deliveryId);
        await touchWebhook(adminDb, hook.id);
      } else {
        const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[1]).toISOString();
        await (adminDb as any).from('webhook_deliveries').update({
          status: 'failed',
          status_code: result.statusCode,
          response_body: result.responseBody,
          next_retry_at: nextRetryAt,
        }).eq('id', deliveryId);
      }
    }),
  );
}

/**
 * Retry failed webhook deliveries (called from cron)
 */
export async function retryFailedWebhooks(): Promise<number> {
  const adminDb = createAdminClient();

  const { data: deliveries } = await (adminDb as any)
    .from('webhook_deliveries')
    .select('*')
    .eq('status', 'failed')
    .lt('attempts', MAX_ATTEMPTS)
    .lte('next_retry_at', new Date().toISOString())
    .limit(50);

  if (!deliveries || deliveries.length === 0) return 0;

  let retried = 0;

  for (const delivery of deliveries as any[]) {
    // Get the webhook endpoint
    const { data: hook } = await adminDb
      .from('webhooks')
      .select('*')
      .eq('id', delivery.webhook_id)
      .single();

    if (!hook) continue;
    const hookRow = hook as unknown as WebhookRow;

    const attempt = delivery.attempts + 1;
    const body = JSON.stringify(delivery.payload);
    const result = await deliver(hookRow.url, hookRow.secret, body, delivery.event, delivery.id);

    if (result.success) {
      await (adminDb as any).from('webhook_deliveries').update({
        status: 'success',
        status_code: result.statusCode,
        response_body: result.responseBody,
        delivered_at: new Date().toISOString(),
        attempts: attempt,
      }).eq('id', delivery.id);
      await touchWebhook(adminDb, hookRow.id);
    } else {
      const nextRetryAt = attempt < MAX_ATTEMPTS
        ? new Date(Date.now() + RETRY_DELAYS[attempt]).toISOString()
        : null;

      await (adminDb as any).from('webhook_deliveries').update({
        status: 'failed',
        status_code: result.statusCode,
        response_body: result.responseBody,
        attempts: attempt,
        next_retry_at: nextRetryAt,
      }).eq('id', delivery.id);
    }

    retried++;
  }

  return retried;
}
