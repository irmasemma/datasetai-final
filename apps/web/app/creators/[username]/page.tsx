import { notFound } from 'next/navigation';
import { getCreatorPage } from '../../../lib/catalog';
import { CatalogGrid } from '../../../components/CatalogGrid';
import { JsonLd } from '../../../components/JsonLd';
import { publisherJsonLd, breadcrumbJsonLd } from '../../../lib/jsonld';

export const revalidate = 60;

interface Params {
  username: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const page = await getCreatorPage(username);
  if (!page) return { title: 'Creator not found' };
  return {
    title: page.creator.displayName,
    description: page.creator.bio || `Agents by ${page.creator.displayName}.`,
    alternates: { canonical: `/creators/${username}` },
  };
}

export default async function CreatorPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const page = await getCreatorPage(username);
  if (!page) notFound();
  const totalInstalls = page.agents.reduce((acc, a) => acc + a.installCountLifetime, 0);
  return (
    <div className="space-y-8">
      <JsonLd
        data={[
          publisherJsonLd(page.creator),
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Publishers', url: '/agents' },
            { name: page.creator.displayName, url: `/creators/${page.creator.username}` },
          ]),
        ]}
      />
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          {page.creator.displayName}
          {page.creator.isVerifiedPublisher && (
            <span className="rounded bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand">
              verified
            </span>
          )}
        </h1>
        {page.creator.bio && (
          <p className="text-lg text-muted-foreground">{page.creator.bio}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {page.agents.length} agents · {totalInstalls.toLocaleString()} lifetime installs
        </p>
      </header>
      <h2 className="sr-only">Published agents</h2>
      <CatalogGrid agents={page.agents} />
    </div>
  );
}
