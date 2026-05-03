import Link from 'next/link';
import { SITE } from '../lib/site';

const LINKS: ReadonlyArray<{ label: string; href: string; external?: boolean }> = [
  { label: 'Agents', href: '/agents' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Publish', href: '/publish' },
  { label: 'GitHub', href: SITE.github, external: true },
  { label: 'Status', href: 'https://status.datasetai.xyz', external: true },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="mt-32 border-t border-border">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2 text-sm font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center bg-foreground font-mono text-[11px] font-bold text-background"
            >
              d/
            </span>
            {SITE.legalName}
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                {...(l.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-border pt-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {SITE.legalName} · the agent registry
          </p>
          <p>
            Claude Code · Cursor · Codex · Aider · Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
