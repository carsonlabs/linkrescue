import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhook } from '@/lib/webhooks';

// POST /api/v1/webhooks/test — send a test webhook
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { webhookId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Verify ownership of the webhook
  if (body.webhookId) {
    const { data: hook } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', body.webhookId)
      .eq('user_id', user.id)
      .single();

    if (!hook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }
  }

  // Fire a test event
  await dispatchWebhook(user.id, 'scan.completed', {
    test: true,
    message: 'This is a test webhook from LinkRescue.',
    siteId: 'test-site-id',
    domain: 'example.com',
    scanId: 'test-scan-id',
    pagesScanned: 42,
    linksChecked: 187,
    issuesFound: 3,
  });

  return NextResponse.json({ success: true, message: 'Test webhook sent' });
}
