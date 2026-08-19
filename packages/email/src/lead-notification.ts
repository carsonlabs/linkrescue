import React from 'react';
import { sendEmail } from './send';
import { LeadNotification, type LeadNotificationProps } from './templates/lead-notification';

type LeadNotificationPayload = Omit<LeadNotificationProps, 'capturedAt'> & {
  leadId: string;
  capturedAt?: string;
};

export async function sendLeadNotification(payload: LeadNotificationPayload) {
  if (process.env.LEAD_NOTIFICATION_ENABLED !== 'true') {
    return { skipped: true as const, reason: 'disabled' as const };
  }

  const ownerEmail = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!ownerEmail || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error(
      'Lead notifications are enabled but LEAD_NOTIFICATION_EMAIL, RESEND_API_KEY, or RESEND_FROM_EMAIL is missing',
    );
  }

  return sendEmail({
    to: ownerEmail,
    subject: `New LinkRescue lead: ${payload.siteUrl || payload.email}`,
    idempotencyKey: `lead-notification/${payload.leadId}`,
    react: React.createElement(LeadNotification, {
      ...payload,
      capturedAt: payload.capturedAt ?? new Date().toISOString(),
    }),
  });
}
