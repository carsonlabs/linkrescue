import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testSlackWebhook } from '@/lib/slack';

// POST /api/v1/slack/test — send a test Slack message
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('webhook_url')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!integration) {
    return NextResponse.json({ error: 'No active Slack integration found' }, { status: 404 });
  }

  const success = await testSlackWebhook((integration as any).webhook_url);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send test message. Check your webhook URL.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Test message sent to Slack' });
}
