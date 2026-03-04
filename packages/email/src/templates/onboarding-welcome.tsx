import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export interface OnboardingWelcomeProps {
  name: string;
  appUrl: string;
}

export function OnboardingWelcome({ name, appUrl }: OnboardingWelcomeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
            Welcome to LinkRescue!
          </Heading>
          <Text>Hi {name},</Text>
          <Text>
            Thanks for signing up. LinkRescue monitors your affiliate links and alerts
            you the moment one breaks, redirects incorrectly, or loses tracking parameters.
          </Text>
          <Text style={{ fontWeight: 'bold' }}>
            Get started in 60 seconds:
          </Text>
          <Text style={{ margin: '4px 0' }}>1. Add your site domain</Text>
          <Text style={{ margin: '4px 0' }}>2. We&apos;ll run your first scan automatically</Text>
          <Text style={{ margin: '4px 0' }}>3. See which affiliate links need attention</Text>

          <Section style={{ marginTop: '24px' }}>
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
              Add Your First Site
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you signed up for LinkRescue.
            Reply to this email if you have any questions — we read every reply.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
