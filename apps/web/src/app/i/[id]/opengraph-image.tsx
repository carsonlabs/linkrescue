import { ImageResponse } from 'next/og';
import { createAdminClient } from '@linkrescue/database';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

const KIND_COLORS: Record<string, { label: string; accent: string }> = {
  summary: { label: 'SUMMARY', accent: '#60a5fa' },
  recommendation: { label: 'RECOMMENDATION', accent: '#c084fc' },
  alert_suppression: { label: 'AUTO-SUPPRESSED', accent: '#fbbf24' },
  program_risk: { label: 'PROGRAM RISK', accent: '#f87171' },
};

export default async function OgImage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('curator_insights')
    .select('kind, headline, body')
    .eq('id', params.id)
    .single();

  const insight = (data as { kind: string; headline: string; body: string | null } | null) ?? null;
  const meta = insight ? KIND_COLORS[insight.kind] ?? KIND_COLORS.summary : KIND_COLORS.summary;
  const headline = insight?.headline ?? 'LinkRescue Curator';
  const body =
    insight?.body ??
    'Weekly AI insights on your affiliate link health. linkrescue.io';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0b0f1a 0%, #1a2332 100%)',
          padding: '72px',
          color: '#f1f5f9',
          fontFamily: 'system-ui',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: meta.accent,
              letterSpacing: '0.15em',
              marginBottom: 32,
            }}
          >
            {meta.label}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 24,
            }}
          >
            {headline}
          </div>
          {body && (
            <div
              style={{
                fontSize: 28,
                color: '#94a3b8',
                lineHeight: 1.4,
                maxWidth: 1000,
              }}
            >
              {body.slice(0, 180)}
              {body.length > 180 ? '…' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2dd4a8 0%, #c084fc 100%)',
            }}
          />
          <div style={{ fontSize: 26, fontWeight: 700 }}>LinkRescue Curator</div>
          <div style={{ fontSize: 22, color: '#64748b', marginLeft: 12 }}>linkrescue.io</div>
        </div>
      </div>
    ),
    size,
  );
}
