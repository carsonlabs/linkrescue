export { sendEmail } from './send';
export { RevenueLeakReport } from './templates/revenue-leak-report';
export { WelcomeEmail } from './templates/welcome';
export { OnboardingScanEmail } from './templates/onboarding-scan';
export { sendWeeklyDigest } from './digest';
export { sendMonthlyHealthReport } from './monthly-report';
export { MonthlyHealthReport } from './templates/monthly-health-report';
export type { MonthlyHealthReportProps } from './templates/monthly-health-report';

// Onboarding sequence
export { OnboardingWelcome } from './templates/onboarding-welcome';
export { OnboardingTips } from './templates/onboarding-tips';
export { OnboardingHealthScore } from './templates/onboarding-health-score';
export { OnboardingProgress } from './templates/onboarding-progress';

// Upgrade nurture
export { UpgradeNudge } from './templates/upgrade-nudge';
export type { UpgradeNudgeTrigger, UpgradeNudgeProps } from './templates/upgrade-nudge';

// Win-back
export { Winback } from './templates/winback';
export type { WinbackStage, WinbackProps } from './templates/winback';
