import { notFound } from 'next/navigation';
import { getCreatorPage } from '../../../lib/catalog';
import { CatalogGrid } from '../../../components/CatalogGrid';

export const revalidate = 60;

interface Params {
  username: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const page = await getCreatorPage(username);
  if (!page) return { title: 'Creator not found — datasetai.xyz' };
  return {
    title: `${page.creator.displayName} — datasetai.xyz`,
    description: page.creator.bio || `Agents by ${page.creator.displayName}.`,
  };
}

export default async function CreatorPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const page = await getCreatorPage(username);
  if (!page) notFound();
  const totalInstalls = page.agents.reduce((acc, a) => acc + a.installCountLifetime, 0);
  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          {page.creator.displayName}
          {page.creator.isVerifiedPublisher && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              verified
            </span>
          )}
        </h1>
        {page.creator.bio && (
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{page.creator.bio}</p>
        )}
        <p className="text-sm text-neutral-500">
          {page.agents.length} agents · {totalInstalls.toLocaleString()} lifetime installs
        </p>
      </header>
      <CatalogGrid agents={page.agents} />
    </main>
  );
}
