import { listAgents, listCategories } from '../../lib/catalog';
import { CatalogGrid } from '../../components/CatalogGrid';
import { Filters } from '../../components/Filters';

export const revalidate = 60;

export const metadata = {
  title: 'Browse agents — datasetai.xyz',
  description: 'Browse the full catalog of AI agents across formats and tools.',
};

type SearchParams = Readonly<Record<string, string | undefined>>;

export default async function CatalogPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await props.searchParams;
  const filters = {
    format: params['format'],
    category: params['category'],
    tool: params['tool'],
    sort: ((params['sort'] ?? 'most-installed') as 'most-installed' | 'recent' | 'relevance'),
    limit: 20,
  };
  const [agents, categories] = await Promise.all([listAgents(filters), listCategories()]);

  return (
    <main className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
      <Filters basePath="/agents" current={params} categories={categories} />
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">All agents</h1>
        <CatalogGrid agents={agents} />
      </div>
    </main>
  );
}
