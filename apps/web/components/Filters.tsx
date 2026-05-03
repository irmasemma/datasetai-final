// Server component renders simple link-driven filters; URL is the state. No JS needed.
// Keyboard-navigable, screen-reader-friendly. Per FR-DSC-3 / E2.4 the URL is shareable.

import Link from 'next/link';
import type { ReactNode } from 'react';

const FORMATS = [
  { id: 'claude-skill', label: 'Claude Skill' },
  { id: 'mcp-server', label: 'MCP Server' },
];

const SORTS = [
  { id: 'most-installed', label: 'Most installed' },
  { id: 'recent', label: 'Recently updated' },
  { id: 'relevance', label: 'Relevance' },
];

function buildUrl(
  base: string,
  current: Readonly<Record<string, string | undefined>>,
  patch: Readonly<Record<string, string | null>>,
): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== 'all') params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function Filters(props: {
  basePath: string;
  current: Readonly<Record<string, string | undefined>>;
  categories: ReadonlyArray<{ category: string; count: number }>;
}): ReactNode {
  const { basePath, current, categories } = props;
  return (
    <aside className="space-y-6 text-sm" aria-label="Filters">
      <FilterGroup label="Format">
        <FilterLink
          href={buildUrl(basePath, current, { format: null })}
          active={!current['format']}
        >
          All formats
        </FilterLink>
        {FORMATS.map((f) => (
          <FilterLink
            key={f.id}
            href={buildUrl(basePath, current, { format: f.id })}
            active={current['format'] === f.id}
          >
            {f.label}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup label="Category">
        <FilterLink
          href={buildUrl(basePath, current, { category: null })}
          active={!current['category']}
        >
          All categories
        </FilterLink>
        {categories.map((c) => (
          <FilterLink
            key={c.category}
            href={buildUrl(basePath, current, { category: c.category })}
            active={current['category'] === c.category}
          >
            {c.category} <span className="text-neutral-400">({c.count})</span>
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup label="Sort">
        {SORTS.map((s) => (
          <FilterLink
            key={s.id}
            href={buildUrl(basePath, current, { sort: s.id })}
            active={current['sort'] === s.id}
          >
            {s.label}
          </FilterLink>
        ))}
      </FilterGroup>
      {Object.values(current).some((v) => v) && (
        <Link
          href={basePath}
          className="text-xs text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          Clear filters
        </Link>
      )}
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </legend>
      <div className="flex flex-col gap-1.5">{children}</div>
    </fieldset>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'rounded bg-neutral-900 px-2 py-1 text-white dark:bg-neutral-50 dark:text-neutral-900'
          : 'rounded px-2 py-1 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
      }
    >
      {children}
    </Link>
  );
}
