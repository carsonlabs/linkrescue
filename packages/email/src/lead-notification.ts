import React from 'react';
import { sendEmail } from './send';
import { LeadNotification, type LeadNotificationProps } from './templates/lead-notification';

export async function sendLeadNotification(payload: Omit<LeadNotificationProps, 'capturedAt'> & { capturedAt?: string }) {
  const ownerEmail = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!ownerEmail || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn('[email] Lead notification skipped because Resend or owner notification configuration is missing');
    return { skipped: true as const };
  }

  return sendEmail({
    to: ownerEmail,
    subject: `New LinkRescue lead: ${payload.siteUrl || payload.email}`,
    react: React.createElement(LeadNotification, {
      ...payload,
      capturedAt: payload.capturedAt ?? new Date().toISOString(),
    }),
  });
}
