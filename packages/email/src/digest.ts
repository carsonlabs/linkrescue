import { sendEmail } from './send';
import { RevenueLeakReport } from './templates/revenue-leak-report';
import React from 'react';

interface DigestData {
  email: string;
  domain: string;
  siteId: string;
  issues: Array<{
    href: string;
    pageUrl: string;
    issueType: 'OK' | 'BROKEN_4XX' | 'SERVER_5XX' | 'TIMEOUT' | 'REDIRECT_TO_HOME' | 'LOST_PARAMS';
    statusCode: number | null;
    isAffiliate: boolean;
  }>;
  appUrl: string;
}

export async function sendWeeklyDigest(data: DigestData) {
  if (data.issues.length === 0) return null;

  return sendEmail({
    to: data.email,
    subject: `LinkRescue: ${data.issues.length} issue${data.issues.length !== 1 ? 's' : ''} found on ${data.domain}`,
    react: React.createElement(RevenueLeakReport, {
      domain: data.domain,
      issues: data.issues,
      totalIssues: data.issues.length,
      appUrl: data.appUrl,
      siteId: data.siteId,
    }),
  });
}
