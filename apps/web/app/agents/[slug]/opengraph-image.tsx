import { ImageResponse } from 'next/og';
import { getAgentBySlug } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const alt = 'Agent on datasetai.xyz';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Params {
  slug: string;
}

export default async function AgentOG({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const result = await getAgentBySlug(slug);

  const name = result?.card.name ?? 'Agent not found';
  const description = result?.card.description ?? '';
  const installCmd = `npx datasetai install ${slug}`;
  const format = result?.card.primaryFormat ?? '';
  const installs = result?.card.installCountLifetime ?? 0;
  const creator = result?.creator?.displayName ?? null;
  const verified = result?.creator?.isVerifiedPublisher ?? false;

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
            'radial-gradient(circle at 90% 100%, rgba(34, 211, 238, 0.1) 0px, transparent 500px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            datasetai.xyz
          </div>
          {format && (
            <div
              style={{
                padding: '8px 16px',
                background: '#171717',
                border: '1px solid #262626',
                borderRadius: 999,
                fontSize: 20,
                color: '#a3a3a3',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {format}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexGrow: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 74,
              fontWeight: 800,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1056,
            }}
          >
            {name}
          </div>

          {description && (
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#a3a3a3',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                maxWidth: 1056,
                lineHeight: 1.4,
                overflow: 'hidden',
              }}
            >
              {description}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 22px',
              background: '#171717',
              border: '1px solid #262626',
              borderRadius: 12,
              fontSize: 24,
              maxWidth: 1056,
            }}
          >
            <span style={{ color: '#525252' }}>$</span>
            <span style={{ color: '#fafafa' }}>{installCmd}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              fontSize: 20,
              color: '#737373',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {creator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>by {creator}</span>
                {verified && (
                  <span style={{ color: '#22d3ee', fontSize: 18 }}>verified</span>
                )}
              </div>
            )}
            {installs > 0 && (
              <div>{installs.toLocaleString()} lifetime installs</div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
