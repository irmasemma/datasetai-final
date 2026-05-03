import Link from 'next/link';
import { Brand } from '@datasetai/ui';

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="text-base font-semibold">
          <Brand />
        </Link>
        <nav className="flex items-center gap-5 text-sm text-neutral-600 dark:text-neutral-400">
          <Link href="/agents" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Browse
          </Link>
          <Link href="/categories" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Categories
          </Link>
          <Link href="/search" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
