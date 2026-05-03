import Link from 'next/link';
import { SITE } from '../lib/site';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  heading: string;
  links: ReadonlyArray<FooterLink>;
}

const COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    heading: 'Product',
    links: [
      { label: 'Browse agents', href: '/agents' },
      { label: 'Categories', href: '/categories' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Publishers',
    links: [
      { label: 'Publish an agent', href: '/publish' },
      { label: 'Claim a listing', href: '/agents' },
      { label: 'Creator dashboard', href: '/dashboard/agents' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Status', href: 'https://status.datasetai.xyz', external: true },
      {
        label: 'GitHub',
        href: SITE.github,
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="mt-24 border-t border-border bg-muted/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          <div className="col-span-2 space-y-3 sm:col-span-3 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span
                aria-hidden
                className="inline-flex size-7 items-center justify-center rounded-md border border-brand-500/40 bg-brand-500/10 font-mono text-xs text-brand"
              >
                d/
              </span>
              {SITE.legalName}
            </Link>
            <p className="max-w-xs text-xs text-muted-foreground">{SITE.tagline}.</p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.heading}
              </h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(link.external
                        ? { target: '_blank', rel: 'noreferrer noopener' }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {SITE.legalName}. Format-agnostic agent registry.
          </p>
          <p className="font-mono">
            Built for Claude Code · Cursor · Codex · Aider · Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
