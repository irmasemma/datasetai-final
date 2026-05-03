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
    <main className="space-y-16">
      <section className="grid grid-cols-1 items-center gap-10 pt-4 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-8">
        <div className="space-y-6">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-500/40 hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
            Format-agnostic. Cross-tool. Coming with creator economy.
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            npm for AI agents.
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
            One registry for Claude Skills, MCP servers, and the agent definition files that come
            next. One CLI to install them in whichever tool you use.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Browse agents
              <svg
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-500/40"
            >
              Publish your agent
            </Link>
          </div>
        </div>

        <div className="lg:pl-4">
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
    </main>
  );
}
