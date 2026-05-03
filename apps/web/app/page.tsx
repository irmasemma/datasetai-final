import Link from 'next/link';
import { listAgents, listCategories } from '../lib/catalog';
import { CatalogGrid } from '../components/CatalogGrid';
import { Filters } from '../components/Filters';
import { TerminalHero } from '../components/TerminalHero';
import { TrustStrip } from '../components/TrustStrip';
import { TrendingRail } from '../components/TrendingRail';

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
  const [agents, categories, trending, recentlyUpdated, allForStats] = await Promise.all([
    listAgents(filters),
    listCategories(),
    listAgents({ limit: 4, sort: 'most-installed' }),
    listAgents({ limit: 4, sort: 'recent' }),
    listAgents({ limit: 5000, sort: 'most-installed' }),
  ]);

  const stats = {
    agents: allForStats.length,
    publishers: new Set(
      allForStats.map((a) => a.creatorLogin).filter((l): l is string => Boolean(l)),
    ).size,
    installs30d: allForStats.reduce((acc, a) => acc + a.installCount30d, 0),
  };

  return (
    <div className="space-y-16">
      <section className="grid grid-cols-1 items-end gap-12 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-12">
        <div className="space-y-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
            v0 · the agent registry
          </p>

          <h1 className="text-5xl font-extrabold leading-[0.92] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-[5.5rem]">
            npm for
            <br />
            AI agents.
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Claude Skills, MCP servers, AGENTS.md, <span className="font-mono text-[0.92em]">.cursorrules</span>
            {' '}— one registry, one CLI, every tool.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Link
              href="/agents"
              className="group inline-flex items-center gap-2 rounded-none bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-px"
            >
              Browse the registry
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                aria-hidden
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link
              href="/publish"
              className="text-sm font-semibold text-foreground underline decoration-brand decoration-2 underline-offset-[6px] transition-colors hover:text-brand"
            >
              Publish an agent →
            </Link>
          </div>
        </div>

        <div className="lg:translate-y-2">
          <TerminalHero />
        </div>
      </section>

      <TrustStrip stats={stats} />

      <TrendingRail
        title="Trending this month"
        subtitle="Most installed in the last 30 days"
        href="/agents?sort=most-installed"
        agents={trending}
        emptyLabel="No trending agents yet — check back as the catalog grows."
      />

      <TrendingRail
        title="Recently updated"
        subtitle="Fresh versions and new releases"
        href="/agents?sort=recent"
        agents={recentlyUpdated}
        emptyLabel="No recent updates yet."
      />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <Filters basePath="/" current={params} categories={categories} />
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Browse the full catalog</h2>
            <Link
              href="/agents"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <CatalogGrid agents={agents} />
        </div>
      </section>
    </div>
  );
}
