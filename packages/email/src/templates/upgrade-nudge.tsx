import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export type UpgradeNudgeTrigger =
  | 'scan_limit'
  | 'site_limit'
  | 'revenue_gated'
  | 'active_free_user';

export interface UpgradeNudgeProps {
  name: string;
  appUrl: string;
  trigger: UpgradeNudgeTrigger;
  domain?: string;
  issueCount?: number;
  loginCount?: number;
  issuesFixed?: number;
  discountCode?: string;
}

const triggerContent: Record<UpgradeNudgeTrigger, {
  subject: string;
  headline: string;
  getBody: (props: UpgradeNudgeProps) => string[];
  cta: string;
  ctaUrl: (appUrl: string) => string;
}> = {
  scan_limit: {
    subject: 'Your weekly scan found issues — want daily monitoring?',
    headline: 'Catch broken links faster with daily scans',
    getBody: (p) => [
      `Your weekly scan of ${p.domain || 'your site'} found ${p.issueCount || 'several'} issues. That's great — you caught them. But how many broke during the 6 days between scans?`,
      'Affiliate links can break any day. A merchant closes their program on Tuesday, but your weekly scan doesn\'t run until Saturday. That\'s 4 days of visitors hitting dead links.',
      'Pro scans daily, so you catch issues within 24 hours — not 7 days.',
    ],
    cta: 'Upgrade to Daily Scans — $29/mo',
    ctaUrl: (appUrl) => `${appUrl}/pricing`,
  },
  site_limit: {
    subject: 'Want to monitor another site?',
    headline: 'Monitor up to 5 sites with Pro',
    getBody: (p) => [
      `You tried to add ${p.domain || 'a second site'}. The Starter plan monitors 1 site — Pro unlocks 5 sites with deeper scanning.`,
      'Pro scans up to 2,000 pages per site (vs 200 on Starter), runs daily instead of weekly, and includes revenue estimates so you know which broken links to fix first.',
    ],
    cta: 'Unlock 5 Sites with Pro',
    ctaUrl: (appUrl) => `${appUrl}/pricing`,
  },
  revenue_gated: {
    subject: 'Curious how much broken links are costing you?',
    headline: 'See your revenue at risk',
    getBody: () => [
      'You tried to view revenue estimates — that\'s a Pro feature. Here\'s what you\'re missing:',
      'Pro users discover an average of $180/month in at-risk affiliate revenue. That\'s commissions you\'re losing to broken links, stripped tracking tags, and dead merchant programs.',
      'For $29/month, you get revenue estimates plus daily scans, AI fix suggestions, and priority monitoring for your most important affiliate links.',
    ],
    cta: 'See Your Revenue at Risk',
    ctaUrl: (appUrl) => `${appUrl}/pricing`,
  },
  active_free_user: {
    subject: 'You\'re serious about your affiliate links',
    headline: 'A special offer for power users',
    getBody: (p) => [
      `You've logged in ${p.loginCount || 'multiple'} times and fixed ${p.issuesFixed || 'several'} issues. You clearly care about keeping your affiliate links healthy.`,
      'Power users like you get the most from Pro. Daily scans catch issues the same day they happen. Revenue estimates help you prioritize the highest-value fixes. AI suggestions tell you exactly how to fix each broken link.',
      p.discountCode
        ? `Here's 20% off your first 3 months: use code ${p.discountCode} at checkout.`
        : 'Here\'s 20% off your first 3 months to say thanks for being an engaged user.',
    ],
    cta: 'Claim Your 20% Discount',
    ctaUrl: (appUrl) => `${appUrl}/pricing`,
  },
};

export function UpgradeNudge(props: UpgradeNudgeProps) {
  const { name, appUrl, trigger } = props;
  const content = triggerContent[trigger];

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
            {content.headline}
          </Heading>
          <Text>Hi {name},</Text>

          {content.getBody(props).map((paragraph, i) => (
            <Text key={i}>{paragraph}</Text>
          ))}

          <Section style={{ marginTop: '24px' }}>
            <Button
              href={content.ctaUrl(appUrl)}
              style={{
                backgroundColor: '#7c3aed',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              {content.cta}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you have a free LinkRescue account.
            Reply to this email if you have questions about Pro features.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
