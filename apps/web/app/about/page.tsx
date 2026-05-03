import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '../../components/JsonLd';
import { breadcrumbJsonLd } from '../../lib/jsonld';
import { SITE } from '../../lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: `${SITE.legalName} is a format-agnostic registry for AI agent definition files — Claude Skills, MCP servers, AGENTS.md, .cursorrules, and more. One CLI, every tool.`,
  alternates: { canonical: '/about' },
};

interface Principle {
  heading: string;
  body: string;
}

const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    heading: 'Format-agnostic by design.',
    body:
      'Claude Skills, MCP servers, AGENTS.md, .cursorrules, system prompts, framework configs — every format ships first-class through one CLI. No competitor handles more than two well.',
  },
  {
    heading: 'Cross-tool from day one.',
    body:
      'Claude Code, Cursor, Codex CLI, Aider, Gemini CLI, Windsurf — the CLI auto-detects, picks the right format, and installs to the right path. The same logical agent works everywhere.',
  },
  {
    heading: 'Creators get paid.',
    body:
      'Phase 2 ships paid agents with an 80% creator revenue share — 90% for the founding cohort. The platform takes a flat fee, never a per-install cut, so the long tail stays viable.',
  },
  {
    heading: 'Trust is a layer, not a slogan.',
    body:
      'Every release ships a signed manifest. Verified publishers carry a badge. The reporting flow ships before the marketplace flow. We rely on community signal first and automated scanning second.',
  },
  {
    heading: 'No hosted execution.',
    body:
      'We are a registry. We do not run agents. That keeps the blast radius small, the cost-of-goods near zero, and the security model auditable. Bring your own keys, your own runtime, your own tool.',
  },
];

export default function AboutPage() {
  return (
    <main className="space-y-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ])}
      />

      <header className="space-y-5 pt-4">
        <p className="font-mono text-xs uppercase tracking-wider text-brand-500">
          About {SITE.legalName}
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The agent registry the ecosystem is missing.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The 2026 AI-agent ecosystem is mid-explosion and fragmented across format-narrow
          registries and unmonetized awesome-lists. {SITE.legalName} is the multi-format,
          cross-tool, creator-monetized registry that should have existed already.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <article
            key={p.heading}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-base font-semibold tracking-tight">{p.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-muted/40 p-6 sm:p-10">
        <h2 className="text-xl font-semibold tracking-tight">The window</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Anthropic, OpenAI, and Cursor are each likely to ship a first-party agent registry
          in the next 12–24 months — and each of those will be locked to its own ecosystem.
          The cross-tool, format-agnostic position is structurally durable, but only if it
          is claimed first. That is what {SITE.legalName} exists to do.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Browse the catalog
          </Link>
          <Link
            href="/publish"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-500/40"
          >
            Publish an agent
          </Link>
        </div>
      </section>
    </main>
  );
}
