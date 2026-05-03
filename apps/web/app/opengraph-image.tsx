import { ImageResponse } from 'next/og';
import { SITE } from '../lib/site';

export const runtime = 'edge';
export const alt = `${SITE.legalName} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.12) 0px, transparent 600px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#22d3ee',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              background: 'rgba(34, 211, 238, 0.12)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              borderRadius: 10,
              color: '#22d3ee',
              fontSize: 24,
            }}
          >
            d/
          </span>
          {SITE.domain}
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 92,
              fontWeight: 800,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: -3,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            {SITE.tagline}.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '20px 28px',
              background: '#171717',
              border: '1px solid #262626',
              borderRadius: 14,
              fontSize: 32,
              maxWidth: 920,
            }}
          >
            <span style={{ color: '#525252' }}>$</span>
            <span style={{ color: '#fafafa' }}>npx datasetai install</span>
            <span style={{ color: '#22d3ee' }}>{'<agent>'}</span>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#a3a3a3',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              maxWidth: 900,
            }}
          >
            One registry for Claude Skills, MCP servers, and the agent definition files
            that come next.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
