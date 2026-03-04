import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LinkRescue — Stop Losing Revenue to Broken Affiliate Links';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🔗
          </div>
          <span style={{ fontSize: '36px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            LinkRescue
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '24px',
          }}
        >
          Stop Losing Revenue to{' '}
          <span style={{ color: '#4ade80' }}>Broken Affiliate Links</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: '24px', color: '#94a3b8', lineHeight: 1.4 }}>
          Daily monitoring · Revenue impact estimates · AI fix suggestions
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '20px',
            color: '#64748b',
          }}
        >
          linkrescue.io
        </div>
      </div>
    ),
    { ...size }
  );
}
