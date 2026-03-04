import { Html, Head, Body, Container, Heading, Text, Button, Hr, Section } from '@react-email/components';

export interface OnboardingTipsProps {
  name: string;
  appUrl: string;
}

export function OnboardingTips({ name, appUrl }: OnboardingTipsProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', marginBottom: '8px' }}>
            3 quick fixes that save most affiliate revenue
          </Heading>
          <Text>Hi {name},</Text>
          <Text>
            Most affiliate revenue loss comes from just three types of link issues.
            Here&apos;s what to look for and how to fix each one:
          </Text>

          <Section style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#991b1b' }}>
              1. Out-of-stock product links
            </Text>
            <Text style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>
              The product page exists but the item is unavailable. Visitors click away,
              you earn nothing. Fix: Replace with an in-stock alternative or a
              category page link.
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#854d0e' }}>
              2. Lost tracking parameters
            </Text>
            <Text style={{ margin: 0, fontSize: '14px', color: '#713f12' }}>
              Redirects strip your affiliate tag (e.g., ?tag=yourstore-20). The visitor
              buys, but you don&apos;t get credit. Fix: Update the link to the current
              direct URL with your tag intact.
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e40af' }}>
              3. Merchant program changes
            </Text>
            <Text style={{ margin: 0, fontSize: '14px', color: '#1e3a5f' }}>
              The merchant left the affiliate network or restructured their URLs.
              All your links to that merchant are dead. Fix: Find the merchant on
              a new network or replace with a competitor product.
            </Text>
          </Section>

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
              Check Your Site for These Issues
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
