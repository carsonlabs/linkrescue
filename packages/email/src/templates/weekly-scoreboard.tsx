import { Html, Head, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';
import { formatCents, formatCentsWhole, monthOverMonthDelta } from '@linkrescue/types';

export interface WeeklyScoreboardProps {
  appUrl: string;
  // Identity
  firstName: string;
  // Scoreboard
  revenueProtectedCents: number;
  revenueProtectedLastMonthCents: number;
  revenueAtRiskCents: number;
  issuesCaughtThisMonth: number;
  issuesResolvedThisMonth: number;
  avgHealthScore7d: number | null;
  topAtRiskProgram: string | null;
  topProgramIssueCount: number;
  // Recent wins (last 7d, top 3)
  recentWins: Array<{
    pageUrl: string;
    network: string | null;
    valueCents: number;
  }>;
  // Currently unresolved (top 3 by value)
  topRisks: Array<{
    pageUrl: string;
    network: string | null;
    issueType: string;
    valueCents: number;
  }>;
  // Curator's note (optional)
  curatorNote: string | null;
  // Plan
  isFreePlan: boolean;
}

const ISSUE_LABEL: Record<string, string> = {
  BROKEN_4XX: 'Broken (404)',
  SERVER_5XX: 'Server error',
  TIMEOUT: 'Timeout',
  REDIRECT_TO_HOME: 'Redirect to home',
  LOST_PARAMS: 'Lost tracking params',
  SOFT_404: 'Soft 404',
  CONTENT_CHANGED: 'Content changed',
};

export function WeeklyScoreboard({
  appUrl,
  firstName,
  revenueProtectedCents,
  revenueProtectedLastMonthCents,
  revenueAtRiskCents,
  issuesCaughtThisMonth,
  issuesResolvedThisMonth,
  avgHealthScore7d,
  topAtRiskProgram,
  topProgramIssueCount,
  recentWins,
  topRisks,
  curatorNote,
  isFreePlan,
}: WeeklyScoreboardProps) {
  const delta = monthOverMonthDelta(revenueProtectedCents, revenueProtectedLastMonthCents);
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const heroValue = isFreePlan ? '$•••••' : formatCentsWhole(revenueProtectedCents);
  const heroSub = isFreePlan
    ? 'Pro unlocks revenue tracking — see what your sites are losing.'
    : 'in affiliate commissions protected this month';

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px', margin: 0 }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <Text style={{ fontSize: '12px', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Your scoreboard · {monthLabel}
          </Text>
          <Heading style={{ fontSize: '20px', margin: '8px 0 0', color: '#111827' }}>
            Hey {firstName}, here&apos;s your week
          </Heading>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          {/* Hero number */}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Text
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: isFreePlan ? '#9ca3af' : '#16a34a',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {heroValue}
            </Text>
            <Text style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0' }}>
              {heroSub}
            </Text>
            {!isFreePlan && delta && delta.sign !== 'flat' && (
              <Text
                style={{
                  fontSize: '13px',
                  color: delta.sign === 'up' ? '#16a34a' : '#dc2626',
                  margin: '6px 0 0',
                  fontWeight: 600,
                }}
              >
                {delta.sign === 'up' ? '↗' : '↘'} {formatCents(Math.abs(delta.absCents))} vs last month
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          {/* Stat row */}
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr>
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1d4ed8' }}>
                    {issuesCaughtThisMonth}
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                    Issues caught
                  </Text>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#16a34a' }}>
                    {issuesResolvedThisMonth}
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                    Fixed
                  </Text>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                  <Text
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      margin: 0,
                      color: avgHealthScore7d === null
                        ? '#9ca3af'
                        : avgHealthScore7d >= 80
                          ? '#16a34a'
                          : avgHealthScore7d >= 60
                            ? '#eab308'
                            : '#dc2626',
                    }}
                  >
                    {avgHealthScore7d ?? '—'}
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                    Health (7d)
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Recent wins */}
          {recentWins.length > 0 && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
              <Heading style={{ fontSize: '16px', margin: '0 0 12px', color: '#111827' }}>
                Wins this week
              </Heading>
              {recentWins.map((win, i) => (
                <Text key={i} style={{ fontSize: '13px', color: '#374151', margin: '4px 0' }}>
                  ✅ Replaced{win.network ? ` ${win.network}` : ''} link on{' '}
                  <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>
                    {truncate(win.pageUrl, 40)}
                  </span>{' '}
                  — <strong style={{ color: '#16a34a' }}>{formatCents(win.valueCents)}</strong> protected
                </Text>
              ))}
            </>
          )}

          {/* Top risks */}
          {topRisks.length > 0 && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
              <Heading style={{ fontSize: '16px', margin: '0 0 4px', color: '#111827' }}>
                Needs attention
              </Heading>
              <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
                {isFreePlan ? 'These are still unresolved.' : `${formatCents(revenueAtRiskCents)} currently at risk.`}
              </Text>
              {topRisks.map((risk, i) => (
                <Section key={i} style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '13px', color: '#374151', margin: '4px 0' }}>
                    ⚠️ {ISSUE_LABEL[risk.issueType] ?? risk.issueType}
                    {risk.network ? ` on ${risk.network}` : ''} —{' '}
                    <strong style={{ color: '#dc2626' }}>{formatCents(risk.valueCents)}</strong>/mo at risk
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0', fontFamily: 'monospace' }}>
                    {truncate(risk.pageUrl, 60)}
                  </Text>
                </Section>
              ))}
            </>
          )}

          {/* Top program */}
          {topAtRiskProgram && topProgramIssueCount >= 2 && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
              <Section style={{ backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '8px' }}>
                <Text style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                  📉 <strong>{topAtRiskProgram}</strong> is degrading —{' '}
                  {topProgramIssueCount} issues caught in the last 7 days.
                </Text>
              </Section>
            </>
          )}

          {/* Curator note */}
          {curatorNote && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
              <Section style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
                <Text style={{ margin: 0, fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Your Curator says
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                  {curatorNote}
                </Text>
              </Section>
            </>
          )}

          {/* CTA */}
          <Section style={{ marginTop: '24px', textAlign: 'center' as const }}>
            <Button
              href={`${appUrl}/dashboard`}
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: 600,
              }}
            >
              View your scoreboard
            </Button>
          </Section>

          {/* Free upsell */}
          {isFreePlan && (
            <>
              <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
              <Section style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
                <Text style={{ margin: 0, fontWeight: 'bold', color: '#581c87' }}>
                  Unlock revenue tracking
                </Text>
                <Text style={{ fontSize: '13px', color: '#7c3aed', margin: '4px 0 12px' }}>
                  Pro shows you exactly what each broken link is costing you, with daily scans and AI fix suggestions.
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
                    fontSize: '13px',
                  }}
                >
                  Upgrade to Pro
                </Button>
              </Section>
            </>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>
            You receive this every Sunday because you have a site monitored by LinkRescue.{' '}
            <a href={`${appUrl}/dashboard/settings`} style={{ color: '#9ca3af' }}>
              Change frequency
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
