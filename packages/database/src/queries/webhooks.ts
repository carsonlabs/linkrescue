import type { Database, WebhookEvent } from '../schema';

type WebhookInsert = Database['public']['Tables']['webhooks']['Insert'];
type Webhook = Database['public']['Tables']['webhooks']['Row'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listWebhooks(supabase: any, userId: string) {
  return supabase.from('webhooks').select('*').eq('user_id', userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWebhook(supabase: any, id: string) {
  return supabase.from('webhooks').select('*').eq('id', id).single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createWebhook(supabase: any, data: WebhookInsert) {
  return supabase.from('webhooks').insert(data).select().single();
}

export async function updateWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Partial<Pick<Webhook, 'url' | 'events'>>,
) {
  return supabase.from('webhooks').update(data).eq('id', id).select().single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteWebhook(supabase: any, id: string) {
  return supabase.from('webhooks').delete().eq('id', id);
}

export async function countWebhooks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function getWebhooksForEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  event: WebhookEvent,
) {
  const { data } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .contains('events', [event]);
  return data ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function touchWebhook(supabase: any, id: string) {
  return supabase
    .from('webhooks')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', id);
}
