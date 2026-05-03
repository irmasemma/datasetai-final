import Link from 'next/link';
import { Brand } from '@datasetai/ui';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="text-base font-semibold">
          <Brand />
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/agents" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/categories" className="hover:text-foreground">
            Categories
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
