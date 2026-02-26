import { sendEmail } from './send';
import { ImmediateRevenueAlert } from './templates/immediate-alert';
import React from 'react';

interface ImmediateAlertData {
  email: string;
  domain: string;
  siteId: string;
  brokenLinkCount: number;
  estimatedMonthlyLoss: number;
  appUrl: string;
}

export async function sendImmediateAlert(data: ImmediateAlertData) {
  // Only send if there are actually broken links
  if (data.brokenLinkCount === 0) return null;

  return sendEmail({
    to: data.email,
    subject: `🚨 LinkRescue: ${data.brokenLinkCount} broken link${data.brokenLinkCount !== 1 ? 's' : ''} detected on ${data.domain}`,
    react: React.createElement(ImmediateRevenueAlert, {
      domain: data.domain,
      brokenLinkCount: data.brokenLinkCount,
      estimatedMonthlyLoss: data.estimatedMonthlyLoss,
      appUrl: data.appUrl,
      siteId: data.siteId,
    }),
  });
}
