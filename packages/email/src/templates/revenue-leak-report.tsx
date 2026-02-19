import { Html, Head, Body, Container, Heading, Text, Section, Button } from '@react-email/components';

interface Issue {
  url: string;
  status: string;
  httpCode: number | null;
}

export function RevenueLeakReport({ siteName, issues }: { siteName: string; issues: Issue[] }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Heading>Weekly Revenue Leak Report for {siteName}</Heading>
          <Text>We found {issues.length} broken or redirected affiliate links on your site.</Text>
          <Section>
            {issues.slice(0, 10).map((issue, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <Text style={{ margin: 0, fontWeight: 'bold' }}>{issue.url}</Text>
                <Text style={{ margin: 0, color: '#666' }}>
                  Status: {issue.status} {issue.httpCode && `(${issue.httpCode})`}
                </Text>
              </div>
            ))}
          </Section>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/sites`}>View All Issues</Button>
        </Container>
      </Body>
    </Html>
  );
}
