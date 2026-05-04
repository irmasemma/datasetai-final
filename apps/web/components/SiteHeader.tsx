import Link from 'next/link';

const NAV: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Agents', href: '/agents' },
  { label: 'Categories', href: '/categories' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-2 font-semibold tracking-[-0.02em]"
          aria-label="datasetai.xyz home"
        >
          <span
            aria-hidden
            className="inline-flex size-7 items-center justify-center border border-brand-500 bg-background font-mono text-[11px] font-bold text-foreground transition-colors group-hover:bg-brand-500/10"
          >
            d/
          </span>
          <span className="text-[15px]">datasetai.xyz</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="group hidden size-8 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:inline-flex"
            aria-label="Search the registry · ⌘K"
          >
            <svg
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
              aria-hidden
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m13 13-2.5-2.5" />
            </svg>
            <kbd className="ml-1.5 hidden border border-border bg-background px-1 font-mono text-[10px] font-medium group-hover:inline-block group-focus-visible:inline-block">
              ⌘K
            </kbd>
          </Link>
          <Link
            href="/publish"
            className="text-sm font-semibold text-foreground underline decoration-brand decoration-2 underline-offset-[6px] transition-colors hover:text-brand"
          >
            Publish →
          </Link>
        </div>
      </div>
    </header>
  );
}
