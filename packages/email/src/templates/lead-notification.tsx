import { Body, Button, Container, Head, Heading, Html, Link, Section, Text } from '@react-email/components';

export interface LeadNotificationProps {
  email: string;
  siteUrl: string | null;
  source: string;
  details?: string | null;
  capturedAt: string;
}

export function LeadNotification({ email, siteUrl, source, details, capturedAt }: LeadNotificationProps) {
  const subjectSite = siteUrl || 'No site supplied';
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <Container style={{ maxWidth: '620px', margin: '0 auto', padding: '28px' }}>
          <Heading style={{ marginBottom: '8px' }}>New LinkRescue pilot lead</Heading>
          <Text style={{ color: '#475569' }}>A visitor requested a human follow-up. No automatic customer email was sent.</Text>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', margin: '20px 0' }}>
            <Text><strong>Contact:</strong> {email}</Text>
            <Text><strong>Site:</strong> {subjectSite}</Text>
            <Text><strong>Source:</strong> {source}</Text>
            <Text><strong>Captured:</strong> {capturedAt}</Text>
            {details ? <Text><strong>Context:</strong> {details}</Text> : null}
          </Section>
          <Button href={`mailto:${email}`} style={{ backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '6px', padding: '12px 18px' }}>
            Reply personally
          </Button>
          <Text style={{ color: '#64748b', fontSize: '12px', marginTop: '24px' }}>
            Verify the site and agree the recovery scope before offering paid work.
          </Text>
          <Link href="https://www.linkrescue.io/pricing" style={{ color: '#16a34a', fontSize: '12px' }}>View live offer</Link>
        </Container>
      </Body>
    </Html>
  );
}
