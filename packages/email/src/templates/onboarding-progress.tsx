import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export interface OnboardingProgressProps {
  name: string;
  appUrl: string;
  isFreePlan: boolean;
  sitesAdded: number;
  scansCompleted: number;
  issuesFound: number;
  issuesResolved: number;
}

export function OnboardingProgress({
  name,
  appUrl,
  isFreePlan,
  sitesAdded,
  scansCompleted,
  issuesFound,
  issuesResolved,
}: OnboardingProgressProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
            Your first 2 weeks with LinkRescue
          </Heading>
          <Text>Hi {name},</Text>
          <Text>
            You&apos;ve been monitoring your affiliate links for 2 weeks. Here&apos;s your progress:
          </Text>

          <Section style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{sitesAdded}</Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Sites added</Text>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{scansCompleted}</Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Scans completed</Text>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: issuesFound > 0 ? '#ef4444' : '#22c55e' }}>
                    {issuesFound}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Issues found</Text>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>
                    {issuesResolved}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Issues resolved</Text>
                </td>
              </tr>
            </table>
          </Section>

          {isFreePlan ? (
            <>
              <Text>
                You&apos;re on the Starter plan with weekly scans. Broken affiliate links can appear
                any day of the week — upgrade to Pro to catch them within 24 hours with daily automated scans.
              </Text>
              <Section style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
                <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#581c87' }}>
                  Upgrade to Pro
                </Text>
                <Text style={{ fontSize: '13px', color: '#7c3aed', margin: '4px 0 0' }}>
                  Daily scans, revenue estimates, AI fix suggestions, and 5 sites for $29/month.
                </Text>
                <Button
                  href={`${appUrl}/pricing`}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '8px',
                    fontSize: '13px',
                  }}
                >
                  Upgrade to Pro
                </Button>
              </Section>
            </>
          ) : (
            <Text>
              Keep it up! Your daily scans are catching issues automatically. Check your
              dashboard to see your health score trend and fix any outstanding issues.
            </Text>
          )}

          <Section style={{ marginTop: '16px' }}>
            <Button
              href={`${appUrl}/dashboard`}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Dashboard
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
