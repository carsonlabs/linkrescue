import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export type WinbackStage = 'day1' | 'day7' | 'day30';

export interface WinbackProps {
  name: string;
  appUrl: string;
  stage: WinbackStage;
  domain?: string;
  newIssueCount?: number;
  discountCode?: string;
}

export function Winback({ name, appUrl, stage, domain, newIssueCount, discountCode }: WinbackProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          {stage === 'day1' && (
            <>
              <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
                We&apos;ll miss you
              </Heading>
              <Text>Hi {name},</Text>
              <Text>
                We see you&apos;ve cancelled your LinkRescue subscription. No hard feelings —
                we appreciate you giving us a try.
              </Text>
              <Text>Here&apos;s what changes now:</Text>
              <Section style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', margin: '12px 0' }}>
                <Text style={{ margin: '0 0 6px', fontSize: '14px' }}>
                  <strong>Scan frequency:</strong> Reverts from daily to weekly
                </Text>
                <Text style={{ margin: '0 0 6px', fontSize: '14px' }}>
                  <strong>Revenue estimates:</strong> No longer available
                </Text>
                <Text style={{ margin: '0 0 6px', fontSize: '14px' }}>
                  <strong>Fix suggestions:</strong> Disabled
                </Text>
                <Text style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Your data:</strong> Kept for 90 days if you come back
                </Text>
              </Section>
              <Text>
                If there&apos;s anything we could have done better, reply to this email.
                We read every response.
              </Text>
              <Section style={{ marginTop: '20px' }}>
                <Button
                  href={`${appUrl}/pricing`}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Changed your mind? Reactivate instantly
                </Button>
              </Section>
            </>
          )}

          {stage === 'day7' && (
            <>
              <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
                {domain ? `${domain} needs attention` : 'Your site needs attention'}
              </Heading>
              <Text>Hi {name},</Text>
              <Text>
                It&apos;s been a week since you cancelled. We ran one last check on
                {domain ? ` ${domain}` : ' your site'}:
              </Text>
              {newIssueCount != null && newIssueCount > 0 ? (
                <Section style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', margin: '12px 0' }}>
                  <Text style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
                    {newIssueCount} new issue{newIssueCount !== 1 ? 's' : ''} detected
                  </Text>
                  <Text style={{ margin: '4px 0 0', fontSize: '14px', color: '#991b1b' }}>
                    Since your last Pro scan, these issues went undetected by weekly scanning.
                    Without daily monitoring, broken links accumulate silently.
                  </Text>
                </Section>
              ) : (
                <Section style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', margin: '12px 0' }}>
                  <Text style={{ margin: 0, fontSize: '14px' }}>
                    Your site looks stable for now, but affiliate links can break at any time.
                    Daily monitoring catches issues the same day they happen.
                  </Text>
                </Section>
              )}
              <Section style={{ marginTop: '20px' }}>
                <Button
                  href={`${appUrl}/pricing`}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Reactivate and Fix These Issues
                </Button>
              </Section>
            </>
          )}

          {stage === 'day30' && (
            <>
              <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
                {name}, your affiliate links need attention
              </Heading>
              <Text>Hi {name},</Text>
              <Text>
                It&apos;s been 30 days since you cancelled. In that time, LinkRescue users
                caught an average of 47 broken affiliate links per site.
              </Text>
              <Text>
                How many has your site accumulated without daily monitoring?
              </Text>
              <Section style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', margin: '12px 0' }}>
                <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#581c87' }}>
                  Welcome back offer
                </Text>
                <Text style={{ fontSize: '14px', color: '#7c3aed', margin: '4px 0 0' }}>
                  {discountCode
                    ? `Use code ${discountCode} for 50% off your first month back.`
                    : 'Reactivate now and get 50% off your first month back.'}
                </Text>
              </Section>
              <Section style={{ marginTop: '20px' }}>
                <Button
                  href={`${appUrl}/pricing`}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  Come Back — 50% Off First Month
                </Button>
              </Section>
            </>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you previously had a LinkRescue subscription.
            Reply &quot;stop&quot; to unsubscribe from these emails.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
