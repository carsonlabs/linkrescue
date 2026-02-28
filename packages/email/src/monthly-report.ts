import { sendEmail } from './send';
import { MonthlyHealthReport, type MonthlyHealthReportProps } from './templates/monthly-health-report';
import React from 'react';

export async function sendMonthlyHealthReport(
  email: string,
  props: MonthlyHealthReportProps
) {
  return sendEmail({
    to: email,
    subject: `LinkRescue: Your monthly health report for ${props.domain}`,
    react: React.createElement(MonthlyHealthReport, props),
  });
}
