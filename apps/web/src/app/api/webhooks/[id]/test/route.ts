import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebhook } from '@linkrescue/database';
import { safeFetch, SsrfError } from '@linkrescue/crawler';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: hook } = await getWebhook(supabase, params.id);
  if (!hook || hook.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let delivered = false;
  let statusCode: number | null = null;

  try {
    const crypto = await import('crypto');
    const payload = JSON.stringify({
      event: 'scan.completed',
      timestamp: new Date().toISOString(),
      data: { test: true },
    });
    const sig = crypto
      .createHmac('sha256', hook.secret)
      .update(payload)
      .digest('hex');

    const res = await safeFetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LinkRescue-Signature': `sha256=${sig}`,
      },
      body: payload,
      timeoutMs: 5000,
      maxRedirects: 0,
    });
    statusCode = res.status;
    delivered = res.ok;
  } catch (err) {
    if (err instanceof SsrfError) {
      return NextResponse.json(
        { delivered: false, error: `Webhook URL rejected: ${err.reason}` },
        { status: 400 },
      );
    }
    delivered = false;
  }

  return NextResponse.json({ delivered, statusCode });
}
