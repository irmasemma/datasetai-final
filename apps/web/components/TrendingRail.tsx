import Link from 'next/link';
import type { AgentCard as AgentCardData } from '@datasetai/db';
import { SourceBadge } from './SourceBadge';

function relativeTime(d: Date): string {
  const now = Date.now();
  const diffDays = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
  return `${Math.floor(diffDays / 365)}y`;
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
      <section className="space-y-5">
        <RailHeader title={title} subtitle={subtitle} href={href} hideViewAll />
        <p className="border border-dashed border-border px-4 py-10 text-center font-mono text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <RailHeader title={title} subtitle={subtitle} href={href} />
      <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => (
          <li key={a.id} className="bg-card">
            <Link
              href={`/agents/${a.id}`}
              className="group hover-lift relative flex h-full flex-col gap-3 p-5 transition-colors hover:bg-card focus-visible:bg-card"
            >
              {/* meta row: handle + source */}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {a.creatorLogin
                    ? `${a.creatorLogin}/${a.id.split('/').pop()}`
                    : a.id}
                </p>
                <SourceBadge source={a.sourceType} />
              </div>

              {/* name + description */}
              <div className="flex-1 space-y-1.5">
                <h3 className="truncate text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-brand">
                  {a.name}
                </h3>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {a.description}
                </p>
              </div>

              {/* bottom: install count headline + meta */}
              <div className="mt-1 flex items-end justify-between border-t border-border pt-3">
                <div className="space-y-0.5">
                  <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                    {a.installCount30d.toLocaleString()}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    installs · 30d
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-brand">
                    <svg
                      viewBox="0 0 12 12"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                      aria-hidden
                    >
                      <path d="M2 6l3 3 5-6" />
                    </svg>
                    signed
                  </span>
                  <span>{relativeTime(a.updatedAt)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailHeader({
  title,
  subtitle,
  href,
  hideViewAll,
}: {
  title: string;
  subtitle?: string;
  href: string;
  hideViewAll?: boolean;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-border pb-3">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {!hideViewAll && (
        <Link
          href={href}
          className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          view all →
        </Link>
      )}
    </header>
  );
}
