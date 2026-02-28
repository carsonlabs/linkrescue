import { createAdminClient } from '@linkrescue/database';

interface SlackIntegration {
  id: string;
  user_id: string;
  webhook_url: string;
  channel_name: string | null;
  notify_broken: boolean;
  notify_scan: boolean;
  notify_weekly: boolean;
  is_active: boolean;
}

type SlackNotificationType = 'broken' | 'scan' | 'weekly';

/**
 * Send a message to a Slack webhook
 */
async function sendSlackMessage(
  webhookUrl: string,
  message: { text: string; blocks?: unknown[] }
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send a Slack notification for a user if they have an active integration
 */
export async function notifySlack(
  userId: string,
  type: SlackNotificationType,
  message: { text: string; blocks?: unknown[] }
): Promise<boolean> {
  const adminDb = createAdminClient();

  const { data } = await adminDb
    .from('slack_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!data) return false;
  const integration = data as unknown as SlackIntegration;

  // Check notification preference
  if (type === 'broken' && !integration.notify_broken) return false;
  if (type === 'scan' && !integration.notify_scan) return false;
  if (type === 'weekly' && !integration.notify_weekly) return false;

  return sendSlackMessage(integration.webhook_url, message);
}

/**
 * Format a scan completion message for Slack
 */
export function formatScanComplete(domain: string, pagesScanned: number, linksChecked: number, issuesFound: number): { text: string; blocks: unknown[] } {
  const emoji = issuesFound > 0 ? ':warning:' : ':white_check_mark:';
  const text = `${emoji} Scan completed for ${domain}: ${linksChecked} links checked, ${issuesFound} issues found.`;

  return {
    text,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `*Pages:* ${pagesScanned} | *Links:* ${linksChecked} | *Issues:* ${issuesFound}` },
        ],
      },
    ],
  };
}

/**
 * Format a broken link alert for Slack
 */
export function formatBrokenLink(domain: string, href: string, pageUrl: string, statusCode: number): { text: string; blocks: unknown[] } {
  const text = `:x: Broken link found on ${domain}`;

  return {
    text,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `:x: *Broken link found on ${domain}*` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Link:*\n${href}` },
          { type: 'mrkdwn', text: `*Status:*\n${statusCode}` },
          { type: 'mrkdwn', text: `*Found on:*\n${pageUrl}` },
        ],
      },
    ],
  };
}

/**
 * Format a weekly summary for Slack
 */
export function formatWeeklySummary(domain: string, totalLinks: number, totalIssues: number, healthScore: number): { text: string; blocks: unknown[] } {
  const scoreEmoji = healthScore >= 80 ? ':green_circle:' : healthScore >= 60 ? ':large_yellow_circle:' : ':red_circle:';
  const text = `${scoreEmoji} Weekly summary for ${domain}: Health score ${healthScore}/100`;

  return {
    text,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${scoreEmoji} *Weekly Summary: ${domain}*` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Health Score:*\n${healthScore}/100` },
          { type: 'mrkdwn', text: `*Total Links:*\n${totalLinks}` },
          { type: 'mrkdwn', text: `*Issues:*\n${totalIssues}` },
        ],
      },
    ],
  };
}

/**
 * Test Slack webhook by sending a test message
 */
export async function testSlackWebhook(webhookUrl: string): Promise<boolean> {
  return sendSlackMessage(webhookUrl, {
    text: ':wave: Hello from LinkRescue! Your Slack integration is working.',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':wave: *Hello from LinkRescue!*\nYour Slack integration is working correctly. You\'ll receive notifications for broken links, scan completions, and weekly summaries.',
        },
      },
    ],
  });
}
