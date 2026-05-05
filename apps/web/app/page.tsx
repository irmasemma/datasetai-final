import Link from 'next/link';
import { listAgents, getCatalogStats } from '../lib/catalog';
import { AgentCard } from '../components/AgentCard';
import { TerminalHero } from '../components/TerminalHero';
import { TrustStrip } from '../components/TrustStrip';
import { ToolCliff } from '../components/ToolCliff';
import { TrendingRail } from '../components/TrendingRail';

export const revalidate = 60;

export default async function HomePage() {
  const [trending, popular, stats] = await Promise.all([
    listAgents({ limit: 4, sort: 'most-installed' }),
    listAgents({ limit: 6, sort: 'most-installed' }),
    getCatalogStats(),
  ]);

  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="grid grid-cols-1 items-end gap-12 pt-6 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:pt-14">
        <div className="space-y-8">
          <h1 className="text-5xl font-extrabold leading-[0.88] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[6.5rem] xl:text-[7.5rem]">
            npm for
            <br />
            AI agents.
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Claude Skills, MCP servers, AGENTS.md,{' '}
            <span className="font-mono text-[0.92em]">.cursorrules</span> — one registry,
            one CLI, every tool.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Link
              href="/agents"
              className="inline-flex items-center bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-px"
            >
              Browse the registry&nbsp;→
            </Link>
            <Link
              href="/publish"
              className="text-sm font-semibold text-foreground underline decoration-brand decoration-2 underline-offset-[6px] transition-colors hover:text-brand"
            >
              Publish an agent →
            </Link>
          </div>
        </div>

        <div>
          <TerminalHero />
        </div>
      </section>

      <TrustStrip stats={stats} />

      <ToolCliff />

      <TrendingRail
        title="Trending this month"
        subtitle="Most installed in the last 30 days"
        href="/agents?sort=most-installed"
        agents={trending}
        emptyLabel="No trending agents yet — check back as the catalog grows."
      />

      {/* Catalog teaser — full filterable workspace lives at /agents */}
      <section aria-labelledby="popular-heading" className="space-y-5">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-3">
          <div className="space-y-1">
            <h2 id="popular-heading" className="text-2xl font-bold tracking-tight">
              Popular this week
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              a slice of the registry
            </p>
          </div>
          <Link
            href="/agents"
            className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            explore all {stats.agents.toLocaleString()} →
          </Link>
        </header>
        <ul
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Popular agents"
        >
          {popular.map((a) => (
            <li key={a.id}>
              <AgentCard agent={a} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
