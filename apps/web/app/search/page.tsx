import { searchAgents, listCategories } from '../../lib/catalog';
import { CatalogGrid } from '../../components/CatalogGrid';
import { Filters } from '../../components/Filters';

export const metadata = {
  title: 'Search — datasetai.xyz',
};

type SearchParams = Readonly<Record<string, string | undefined>>;

export default async function SearchPage(props: { searchParams: Promise<SearchParams> }) {
  const params = await props.searchParams;
  const query = params['q']?.trim() ?? '';
  const [results, categories] = await Promise.all([
    query
      ? searchAgents(query, {
          format: params['format'],
          category: params['category'],
          tool: params['tool'],
        })
      : Promise.resolve([]),
    listCategories(),
  ]);

  return (
    <main className="space-y-6">
      <form action="/search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search agents…"
          aria-label="Search agents"
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-50"
        />
        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <Filters basePath="/search" current={{ ...params, q: query }} categories={categories} />
        <div className="space-y-4">
          {query ? (
            <h1 className="text-xl font-semibold">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
            </h1>
          ) : (
            <p className="text-sm text-neutral-500">Type a query above to find agents.</p>
          )}
          {query && <CatalogGrid agents={results} />}
        </div>
      </div>
    </main>
  );
}
