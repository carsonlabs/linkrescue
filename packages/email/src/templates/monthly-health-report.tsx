import { Html, Head, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';

export interface MonthlyHealthReportProps {
  domain: string;
  siteId: string;
  appUrl: string;
  // Stats
  pagesScanned: number;
  linksChecked: number;
  issuesFound: number;
  issuesResolved: number;
  // Health score
  healthScore: number;
  previousHealthScore: number | null;
  // Revenue (Pro/Agency only)
  estimatedRevenueSaved: number | null;
  // User info
  planName: string;
  isFreePlan: boolean;
}

export function MonthlyHealthReport({
  domain,
  siteId,
  appUrl,
  pagesScanned,
  linksChecked,
  issuesFound,
  issuesResolved,
  healthScore,
  previousHealthScore,
  estimatedRevenueSaved,
  planName,
  isFreePlan,
}: MonthlyHealthReportProps) {
  const scoreDelta = previousHealthScore != null ? healthScore - previousHealthScore : null;
  const scoreTrend = scoreDelta != null
    ? scoreDelta > 0 ? 'improved' : scoreDelta < 0 ? 'declined' : 'stable'
    : null;

  const scoreColor = healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#eab308' : healthScore >= 40 ? '#f97316' : '#ef4444';

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px' }}>
          <Heading style={{ fontSize: '24px', marginBottom: '8px' }}>
            Monthly Link Health Report
          </Heading>
          <Text style={{ color: '#6b7280', marginTop: 0 }}>
            {domain} &middot; {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          {/* Health Score */}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ display: 'inline-block', textAlign: 'center' }}>
              <Text style={{ fontSize: '48px', fontWeight: 'bold', color: scoreColor, margin: 0, lineHeight: 1.2 }}>
                {healthScore}
              </Text>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                Health Score
                {scoreDelta != null && scoreDelta !== 0 && (
                  <span style={{ color: scoreDelta > 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    {' '}({scoreDelta > 0 ? '+' : ''}{scoreDelta} vs last month)
                  </span>
                )}
              </Text>
            </div>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          {/* Stats Grid */}
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{pagesScanned}</Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Pages scanned</Text>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{linksChecked}</Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Links checked</Text>
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

          {/* Revenue Saved (Pro/Agency only) */}
          {estimatedRevenueSaved != null && estimatedRevenueSaved > 0 && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
              <Section style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
                <Text style={{ margin: 0, fontWeight: 'bold', color: '#166534' }}>
                  Estimated revenue protected
                </Text>
                <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e', margin: '4px 0 0' }}>
                  ${(estimatedRevenueSaved / 100).toFixed(2)}
                </Text>
                <Text style={{ fontSize: '12px', color: '#166534', margin: '4px 0 0' }}>
                  Based on redirected traffic and rescued affiliate links this month
                </Text>
              </Section>
            </>
          )}

          {/* CTA */}
          <Section style={{ marginTop: '24px' }}>
            <Button
              href={`${appUrl}/dashboard/sites/${siteId}`}
              style={{
                backgroundColor: '#1f2937',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View Full Report
            </Button>
          </Section>

          {/* Upsell for free users */}
          {isFreePlan && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
              <Section style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
                <Text style={{ margin: 0, fontWeight: 'bold', color: '#581c87' }}>
                  Unlock more with {planName === 'Starter' ? 'Pro' : 'a paid plan'}
                </Text>
                <Text style={{ fontSize: '13px', color: '#7c3aed', margin: '4px 0 0' }}>
                  Get daily scans, revenue estimates, fix suggestions, and monitor up to 5 sites.
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
                  View Plans
                </Button>
              </Section>
            </>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            You received this email because you have a site monitored by LinkRescue.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
