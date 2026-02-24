import crypto from 'crypto';
import { createAdminClient, getWebhooksForEvent, touchWebhook } from '@linkrescue/database';
import type { WebhookEvent, WebhookPayload } from '@linkrescue/types';

export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const adminDb = createAdminClient();
  const hooks = await getWebhooksForEvent(adminDb, userId, event);

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    hooks.map(async (hook) => {
      const sig = crypto
        .createHmac('sha256', hook.secret)
        .update(body)
        .digest('hex');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LinkRescue-Signature': `sha256=${sig}`,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        await touchWebhook(adminDb, hook.id);
      } catch {
        // Silently fail
      }
    }),
  );
}
