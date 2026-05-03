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
  number: string;
  heading: string;
  body: string;
}

const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    number: '01',
    heading: 'One registry. Every format. Every tool.',
    body:
      'Claude Skills, MCP servers, AGENTS.md, .cursorrules, system prompts, framework configs — every format ships first-class through one CLI that auto-detects your tool and writes to the right path. The same logical agent works in Claude Code, Cursor, Codex, Aider, and Gemini.',
  },
  {
    number: '02',
    heading: 'Creators keep 80%. Founding cohort keeps 90%.',
    body:
      'Phase 2 ships paid agents with a flat platform fee — never a per-install cut — so the long tail stays viable. Creators set their own price. Free agents stay free; we never take a cut of free.',
  },
  {
    number: '03',
    heading: 'Trust by construction, not by slogan.',
    body:
      'Every release ships a signed manifest. We do not run agents — bring your own keys, your own runtime, your own tool. Small blast radius, auditable security model, near-zero cost-of-goods. Reporting and verified-publisher review ship before paid agents do.',
  },
  {
    number: '04',
    heading: 'No platform lock-in. Ever.',
    body:
      'You own your installs. The CLI writes plain files into plain folders — re-install elsewhere any time, with or without us. Open formats, open standards, transparent attribution on every mirrored listing.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-24 pb-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ])}
      />

      {/* Hero */}
      <header className="space-y-6 pt-6 sm:pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          about · {SITE.legalName}
        </p>
        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
          The agent registry
          <br />
          the ecosystem
          <br />
          is missing.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          The 2026 AI-agent ecosystem is mid-explosion and fragmented across format-narrow
          registries and unmonetized awesome-lists. {SITE.legalName} is the multi-format,
          cross-tool, creator-monetized registry that should have existed already.
        </p>
      </header>

      {/* Principles — numbered editorial layout */}
      <section
        aria-label="Principles"
        className="border-y border-border"
      >
        {PRINCIPLES.map((p, idx) => (
          <article
            key={p.number}
            className={
              'grid grid-cols-1 items-start gap-6 px-0 py-10 sm:py-14 md:grid-cols-[6rem_1fr] ' +
              (idx > 0 ? 'border-t border-border' : '')
            }
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
              {p.number}
            </p>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
                {p.heading}
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {p.body}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* The window — pull quote */}
      <section className="space-y-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          the window
        </p>
        <blockquote className="max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
          &ldquo;Anthropic, OpenAI, and Cursor will each ship a first-party registry in
          the next 12–24 months — locked to their own ecosystem. The cross-tool
          position is structurally durable. It just has to be claimed first.&rdquo;
        </blockquote>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-4">
          <Link
            href="/agents"
            className="group inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-px"
          >
            Browse the registry
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              aria-hidden
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
          <Link
            href="/publish"
            className="text-sm font-semibold text-foreground underline decoration-brand decoration-2 underline-offset-[6px] hover:text-brand"
          >
            Publish an agent →
          </Link>
        </div>
      </section>
    </div>
  );
}
