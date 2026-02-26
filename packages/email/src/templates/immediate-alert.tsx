import { Html, Head, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';

interface ImmediateAlertProps {
  domain: string;
  brokenLinkCount: number;
  estimatedMonthlyLoss: number;
  appUrl: string;
  siteId: string;
}

export function ImmediateRevenueAlert({
  domain,
  brokenLinkCount,
  estimatedMonthlyLoss,
  appUrl,
  siteId,
}: ImmediateAlertProps) {
  const formattedLoss = estimatedMonthlyLoss >= 1000 
    ? `$${(estimatedMonthlyLoss / 1000).toFixed(1)}k`
    : `$${estimatedMonthlyLoss.toFixed(0)}`;

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px' }}>
          <Heading style={{ fontSize: '24px', marginBottom: '8px', color: '#dc2626' }}>
            🚨 Revenue Leak Detected
          </Heading>
          <Text style={{ color: '#6b7280', marginTop: 0 }}>
            {domain}
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          <Section style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <Text style={{ margin: 0, fontSize: '16px' }}>
              We detected <strong>{brokenLinkCount} new broken affiliate link{brokenLinkCount !== 1 ? 's' : ''}</strong> on your site.
            </Text>
            <Text style={{ margin: '12px 0 0', fontSize: '18px', color: '#dc2626' }}>
              Estimated monthly loss: <strong>{formattedLoss}</strong>
            </Text>
          </Section>

          <Text style={{ marginTop: '20px' }}>
            Broken affiliate links mean visitors can't complete purchases, and you miss out on commissions. 
            The sooner you fix them, the less revenue you lose.
          </Text>

          <Button
            href={`${appUrl}/sites/${siteId}`}
            style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '16px',
            }}
          >
            Fix Broken Links Now
          </Button>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you have immediate alerts enabled for critical issues on LinkRescue.
            <br />
            <a href={`${appUrl}/dashboard/settings`} style={{ color: '#6b7280' }}>Manage notification settings</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
