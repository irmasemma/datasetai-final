import Link from 'next/link';
import type { AgentCard as AgentCardData } from '@datasetai/db';
import { SourceBadge } from './SourceBadge';

function relativeTime(d: Date): string {
  const now = Date.now();
  const diffDays = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

interface RailProps {
  title: string;
  subtitle?: string;
  href: string;
  agents: readonly AgentCardData[];
  emptyLabel: string;
}

export function TrendingRail({ title, subtitle, href, agents, emptyLabel }: RailProps) {
  if (agents.length === 0) {
    return (
      <section className="space-y-4">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </header>
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          href={href}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      </header>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => (
          <li key={a.id}>
            <Link
              href={`/agents/${a.id}`}
              className="group block h-full rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand-500/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {a.creatorLogin
                      ? `${a.creatorLogin}/${a.id.split('/').pop()}`
                      : a.id}
                  </p>
                  <h3 className="truncate font-semibold text-foreground group-hover:text-brand">
                    {a.name}
                  </h3>
                </div>
                <SourceBadge source={a.sourceType} />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {a.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 12 12"
                    className="size-3 text-brand"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M2 6l3 3 5-6" />
                  </svg>
                  signed
                </span>
                <span>{a.installCount30d.toLocaleString()} · 30d</span>
                <span>{relativeTime(a.updatedAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
