import { listAgents, listCategories } from '../lib/catalog';
import { CatalogGrid } from '../components/CatalogGrid';
import { Filters } from '../components/Filters';

export const revalidate = 60;

type SearchParams = Readonly<Record<string, string | undefined>>;

export default async function HomePage(props: {
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
    <main className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">npm for AI agents</h1>
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          One registry for Claude Skills, MCP servers, and the agent definition files that come
          next. One CLI to install them anywhere.
        </p>
        <code className="inline-block rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900">
          npx datasetai install &lt;agent&gt;
        </code>
      </section>
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <Filters basePath="/" current={params} categories={categories} />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Latest agents</h2>
          <CatalogGrid agents={agents} />
        </div>
      </section>
    </main>
  );
}
