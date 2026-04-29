import { sendEmail } from './send';
import { WeeklyScoreboard, type WeeklyScoreboardProps } from './templates/weekly-scoreboard';
import { formatCentsWhole } from '@linkrescue/types';
import React from 'react';

export async function sendWeeklyScoreboard(email: string, props: WeeklyScoreboardProps) {
  // Subject is rotated based on what's strongest this week:
  //   - If we protected real $, lead with the number
  //   - If a program is degrading, lead with the warning
  //   - Otherwise, lead with caught-vs-fixed
  let subject: string;
  if (!props.isFreePlan && props.revenueProtectedCents >= 1000) {
    subject = `Your sites protected ${formatCentsWhole(props.revenueProtectedCents)} this month 🛡`;
  } else if (props.topAtRiskProgram && props.topProgramIssueCount >= 2) {
    subject = `${props.topAtRiskProgram} is degrading — ${props.topProgramIssueCount} issues caught this week`;
  } else if (props.issuesCaughtThisMonth > 0) {
    subject = `${props.issuesCaughtThisMonth} issues caught, ${props.issuesResolvedThisMonth} fixed — your scoreboard`;
  } else {
    subject = 'Your weekly LinkRescue scoreboard';
  }

  return sendEmail({
    to: email,
    subject,
    react: React.createElement(WeeklyScoreboard, props),
  });
}
