import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAgentBySlug } from '../../../lib/catalog';
import { recordListingView } from '@datasetai/db';
import { getDb } from '../../../lib/db';
import { ReportButton } from '../../../components/ReportButton';
import { SourceBadge } from '../../../components/SourceBadge';
import { VerifiedBadge } from '../../../components/VerifiedBadge';

export const revalidate = 60;

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const result = await getAgentBySlug(slug);
  if (!result) return { title: 'Agent not found — datasetai.xyz' };
  return {
    title: `${result.card.name} — datasetai.xyz`,
    description: result.card.description,
    openGraph: {
      title: result.card.name,
      description: result.card.description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: result.card.name,
      description: result.card.description,
    },
    alternates: {
      canonical: `/agents/${slug}`,
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const result = await getAgentBySlug(slug);
  if (!result) notFound();

  const db = getDb();
  if (db) {
    try {
      await recordListingView(db, { agentId: slug });
    } catch {
      // listing_views is best-effort
    }
  }

  const { card, creator, versions } = result;
  const installCmd = `npx datasetai install ${card.id}`;

  return (
    <main className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_18rem]">
      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{card.primaryFormat}</p>
            <SourceBadge source={card.sourceType} />
            {creator?.isVerifiedPublisher && <VerifiedBadge />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{card.name}</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{card.description}</p>
        </header>

        {card.sourceType !== 'direct-publish' && (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            Mirrored from <strong>{card.sourceType}</strong>{' '}
            <Link
              href={`/agents/${encodeURIComponent(slug)}/claim`}
              className="underline"
            >
              Claim this listing
            </Link>{' '}
            if you&apos;re the original author.
          </div>
        )}

        {(card.license === 'None' || card.license === 'Custom' || card.license == null) && (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            License is {card.license ?? 'unknown'} — review your rights before installing.
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">README</h2>
          <div className="prose max-w-none rounded border border-neutral-200 bg-white p-6 text-neutral-800 dark:prose-invert dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
            <p>{card.description}</p>
            <p>
              This listing supports the following tools:{' '}
              {card.toolCompatibility.join(', ') || 'none yet'}.
            </p>
          </div>
        </section>

        <div className="flex items-center justify-end">
          <ReportButton agentId={card.id} />
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Versions</h2>
          <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {versions.map((v) => (
              <li
                key={v.version}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="font-mono">{v.version}</span>
                <span className="text-neutral-500">
                  {new Date(v.publishedAt).toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <aside className="space-y-6">
        <section className="rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Install
          </h3>
          <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100">
            {installCmd}
          </pre>
        </section>

        <section className="space-y-2 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Stats
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-neutral-500">30-day installs</dt>
            <dd className="text-right">{card.installCount30d.toLocaleString()}</dd>
            <dt className="text-neutral-500">Lifetime</dt>
            <dd className="text-right">{card.installCountLifetime.toLocaleString()}</dd>
            <dt className="text-neutral-500">License</dt>
            <dd className="text-right">{card.license ?? '—'}</dd>
          </dl>
        </section>

        {creator && (
          <section className="space-y-2 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Creator
            </h3>
            <Link
              href={`/creators/${creator.username}`}
              className="block text-base font-medium hover:underline"
            >
              {creator.displayName}
              {creator.isVerifiedPublisher && (
                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  verified
                </span>
              )}
            </Link>
            {creator.bio && (
              <p className="text-sm text-neutral-500">{creator.bio}</p>
            )}
          </section>
        )}

        {card.tags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${encodeURIComponent(t)}`}
                  className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </section>
        )}
      </aside>
    </main>
  );
}
