import { Html, Head, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';
import type { IssueType } from '@linkrescue/types';

interface DigestIssue {
  href: string;
  pageUrl: string;
  issueType: IssueType;
  statusCode: number | null;
  isAffiliate: boolean;
}

const ISSUE_LABELS: Record<string, string> = {
  BROKEN_4XX: 'Broken (4xx)',
  SERVER_5XX: 'Server Error (5xx)',
  TIMEOUT: 'Timeout',
  REDIRECT_TO_HOME: 'Redirect to Home',
  LOST_PARAMS: 'Lost Parameters',
};

export function RevenueLeakReport({
  domain,
  issues,
  totalIssues,
  appUrl,
  siteId,
}: {
  domain: string;
  issues: DigestIssue[];
  totalIssues: number;
  appUrl: string;
  siteId: string;
}) {
  const affiliateIssues = issues.filter((i) => i.isAffiliate);

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px' }}>
          <Heading style={{ fontSize: '24px', marginBottom: '8px' }}>
            Weekly Revenue Leak Report
          </Heading>
          <Text style={{ color: '#6b7280', marginTop: 0 }}>
            {domain}
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          <Text>
            We found <strong>{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</strong> on your site
            {affiliateIssues.length > 0 && (
              <>, including <strong>{affiliateIssues.length} broken affiliate link{affiliateIssues.length !== 1 ? 's' : ''}</strong> that may be costing you revenue</>
            )}
            .
          </Text>

          <Section>
            {issues.slice(0, 10).map((issue, idx) => (
              <div key={idx} style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                <Text style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', wordBreak: 'break-all' }}>
                  {issue.href}
                </Text>
                <Text style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }}>
                  {ISSUE_LABELS[issue.issueType] || issue.issueType}
                  {issue.statusCode && ` (${issue.statusCode})`}
                  {issue.isAffiliate && ' • Affiliate'}
                </Text>
                <Text style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '11px', wordBreak: 'break-all' }}>
                  Found on: {issue.pageUrl}
                </Text>
              </div>
            ))}
          </Section>

          {totalIssues > 10 && (
            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
              ...and {totalIssues - 10} more issues
            </Text>
          )}

          <Button
            href={`${appUrl}/sites/${siteId}`}
            style={{
              backgroundColor: '#1f2937',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '16px',
            }}
          >
            View All Issues
          </Button>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you have a site monitored by LinkRescue.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
