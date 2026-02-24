import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

interface OnboardingScanEmailProps {
  email: string;
  brokenCount: number;
  affiliateCount: number;
  signupUrl: string;
}

export function OnboardingScanEmail({
  email,
  brokenCount,
  affiliateCount,
  signupUrl,
}: OnboardingScanEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
        <Container style={{ maxWidth: '520px', margin: '0 auto', backgroundColor: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Heading style={{ fontSize: '20px', marginBottom: '8px' }}>
            Your scan found {brokenCount} broken link{brokenCount !== 1 ? 's' : ''}
          </Heading>
          <Text style={{ color: '#666', marginBottom: '24px' }}>
            We scanned your site and here&apos;s what we found:
          </Text>
          <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
            <Text style={{ margin: '0 0 8px 0' }}>
              <strong>{brokenCount}</strong> broken links detected
            </Text>
            <Text style={{ margin: 0, color: '#dc2626' }}>
              <strong>{affiliateCount}</strong> broken affiliate links (potential revenue loss)
            </Text>
          </div>
          <Text style={{ marginBottom: '24px' }}>
            Create a free account to see the full report, set up guardian backup links, and start
            recovering lost revenue.
          </Text>
          <Button
            href={signupUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            See Full Report →
          </Button>
          <Text style={{ fontSize: '12px', color: '#999', marginTop: '24px' }}>
            This email was sent to {email} because you submitted a scan request on LinkRescue.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
