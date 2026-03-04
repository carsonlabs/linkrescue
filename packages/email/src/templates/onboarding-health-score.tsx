import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export interface OnboardingHealthScoreProps {
  name: string;
  appUrl: string;
  siteId?: string;
  healthScore?: number;
}

export function OnboardingHealthScore({ name, appUrl, siteId, healthScore }: OnboardingHealthScoreProps) {
  const scoreColor = healthScore != null
    ? healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#eab308' : healthScore >= 40 ? '#f97316' : '#ef4444'
    : '#6b7280';

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
            What your Site Health Score means
          </Heading>
          <Text>Hi {name},</Text>

          {healthScore != null && (
            <Section style={{ textAlign: 'center', margin: '20px 0' }}>
              <Text style={{ fontSize: '48px', fontWeight: 'bold', color: scoreColor, margin: 0, lineHeight: 1.2 }}>
                {healthScore}
              </Text>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                Your current Health Score
              </Text>
            </Section>
          )}

          <Text>
            Your Health Score is a 0-100 rating of your site&apos;s affiliate link health.
            Here&apos;s what the ranges mean:
          </Text>

          <Section style={{ backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '6px', marginBottom: '8px' }}>
            <Text style={{ margin: 0, fontSize: '14px' }}>
              <strong style={{ color: '#22c55e' }}>80-100:</strong> Excellent. Most links healthy, minimal revenue at risk.
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#fefce8', padding: '12px 16px', borderRadius: '6px', marginBottom: '8px' }}>
            <Text style={{ margin: 0, fontSize: '14px' }}>
              <strong style={{ color: '#eab308' }}>60-79:</strong> Good but watch closely. A few issues need fixing.
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#fff7ed', padding: '12px 16px', borderRadius: '6px', marginBottom: '8px' }}>
            <Text style={{ margin: 0, fontSize: '14px' }}>
              <strong style={{ color: '#f97316' }}>40-59:</strong> Needs attention. Multiple broken links are likely costing you commissions.
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '6px', marginBottom: '8px' }}>
            <Text style={{ margin: 0, fontSize: '14px' }}>
              <strong style={{ color: '#ef4444' }}>Below 40:</strong> Critical. Significant revenue leakage. Fix broken links immediately.
            </Text>
          </Section>

          <Text style={{ marginTop: '16px' }}>
            Your score updates after every scan. Watch it trend upward as you fix issues.
            The historical chart on your dashboard shows your progress over time.
          </Text>

          <Section style={{ marginTop: '24px' }}>
            <Button
              href={siteId ? `${appUrl}/dashboard/sites/${siteId}` : `${appUrl}/dashboard`}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Your Health Score Trend
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you signed up for LinkRescue.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
