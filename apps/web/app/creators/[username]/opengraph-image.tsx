import { ImageResponse } from 'next/og';
import { getCreatorPage } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const alt = 'Publisher on datasetai.xyz';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Params {
  username: string;
}

export default async function CreatorOG({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const page = await getCreatorPage(username);

  const displayName = page?.creator.displayName ?? username;
  const bio = page?.creator.bio ?? '';
  const verified = page?.creator.isVerifiedPublisher ?? false;
  const agentCount = page?.agents.length ?? 0;
  const totalInstalls = page?.agents.reduce((acc, a) => acc + a.installCountLifetime, 0) ?? 0;

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
          padding: 72,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          backgroundImage:
            'radial-gradient(circle at 10% 100%, rgba(34, 211, 238, 0.1) 0px, transparent 500px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#22d3ee',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              background: 'rgba(34, 211, 238, 0.12)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              borderRadius: 8,
            }}
          >
            d/
          </span>
          datasetai.xyz / publishers
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 22,
              color: '#737373',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            @{username}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              fontSize: 86,
              fontWeight: 800,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: -2.5,
              lineHeight: 1.05,
            }}
          >
            {displayName}
            {verified && (
              <span
                style={{
                  fontSize: 28,
                  color: '#22d3ee',
                  background: 'rgba(34, 211, 238, 0.12)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                ✓ verified
              </span>
            )}
          </div>

          {bio && (
            <div
              style={{
                fontSize: 22,
                color: '#a3a3a3',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                maxWidth: 1056,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {bio}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              fontSize: 22,
              color: '#fafafa',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div>
              <span style={{ color: '#22d3ee', fontWeight: 700 }}>
                {agentCount}
              </span>
              <span style={{ color: '#737373' }}> agents</span>
            </div>
            {totalInstalls > 0 && (
              <div>
                <span style={{ color: '#22d3ee', fontWeight: 700 }}>
                  {totalInstalls.toLocaleString()}
                </span>
                <span style={{ color: '#737373' }}> lifetime installs</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
