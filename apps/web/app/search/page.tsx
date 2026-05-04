import { searchAgents, listCategories } from '../../lib/catalog';
import { CatalogGrid } from '../../components/CatalogGrid';
import { Filters } from '../../components/Filters';

export const metadata = {
  title: 'Search',
  alternates: { canonical: '/search' },
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
    <div className="space-y-6">
      <h1 className="sr-only">{query ? `Search results for ${query}` : 'Search agents'}</h1>
      <form action="/search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search agents…"
          aria-label="Search agents"
          className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <Filters basePath="/search" current={{ ...params, q: query }} categories={categories} />
        <div className="space-y-4">
          {query ? (
            <p className="text-xl font-semibold" aria-live="polite">
              {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Type a query above to find agents.</p>
          )}
          {query && <CatalogGrid agents={results} />}
        </div>
      </div>
    </div>
  );
}
