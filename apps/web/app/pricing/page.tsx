import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { JsonLd } from '../../components/JsonLd';
import { breadcrumbJsonLd } from '../../lib/jsonld';
import { SITE } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Discovering and installing agents on ${SITE.legalName} is free. Publishing is free in MVP; the creator-economy paid tier is coming with Phase 2.`,
  alternates: { canonical: '/pricing' },
};

interface Tier {
  name: string;
  price: string;
  priceMeta: string;
  description: string;
  cta: { label: string; href: string };
  primary?: boolean;
}

const TIERS: ReadonlyArray<Tier> = [
  {
    name: 'Discover',
    price: 'Free',
    priceMeta: 'forever',
    description: 'Browse and install. No account needed.',
    cta: { label: 'Browse the registry', href: '/agents' },
  },
  {
    name: 'Publish',
    price: 'Free',
    priceMeta: 'in MVP',
    description: 'Ship public agents. Founding-creator program opens with Phase 2.',
    cta: { label: 'Publish an agent', href: '/publish' },
    primary: true,
  },
  {
    name: 'Enterprise',
    price: 'Talk to us',
    priceMeta: 'phase 3',
    description: 'Private registry, SSO, audit log, on-prem option.',
    cta: { label: 'hello@datasetai.xyz', href: 'mailto:hello@datasetai.xyz' },
  },
];

interface ComparisonRow {
  feature: string;
  values: [string | boolean, string | boolean, string | boolean];
}

const COMPARISON: ReadonlyArray<{ section: string; rows: ReadonlyArray<ComparisonRow> }> = [
  {
    section: 'Discover & install',
    rows: [
      { feature: 'Browse the public registry', values: [true, true, true] },
      { feature: 'One-command CLI install', values: [true, true, true] },
      { feature: 'Cross-tool: Claude Code, Cursor, Codex, Aider, Gemini', values: [true, true, true] },
      { feature: 'Signed-manifest verification', values: [true, true, true] },
      { feature: 'Anonymous browsing (no account required)', values: [true, true, '—'] },
    ],
  },
  {
    section: 'Publish & monetize',
    rows: [
      { feature: 'Publish unlimited public agents', values: ['—', true, true] },
      { feature: 'Linter + manifest signing on every release', values: ['—', true, true] },
      { feature: 'Install metrics broken down by tool', values: ['—', true, true] },
      { feature: 'Verified-publisher review', values: ['—', true, true] },
      { feature: 'Founding-creator 90% rev share', values: ['—', '6 mo', '—'] },
    ],
  },
  {
    section: 'Trust & governance',
    rows: [
      { feature: 'Report-listing flow', values: [true, true, true] },
      { feature: 'Private / team registries', values: ['—', '—', true] },
      { feature: 'SSO (SAML, OIDC)', values: ['—', '—', true] },
      { feature: 'Audit log + RBAC', values: ['—', '—', true] },
      { feature: 'On-prem / air-gapped deploy', values: ['—', '—', true] },
      { feature: 'Automated security scanning', values: ['—', '—', true] },
    ],
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex">
        <span className="sr-only">Included</span>
        <svg
          viewBox="0 0 16 16"
          className="size-4 text-brand"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="square"
          aria-hidden
        >
          <path d="M3 8l3.5 3.5L13 5" />
        </svg>
      </span>
    );
  }
  if (value === false || value === '—') {
    return (
      <>
        <span className="sr-only">Not included</span>
        <span aria-hidden className="text-muted-foreground">—</span>
      </>
    );
  }
  return (
    <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="space-y-20 pb-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Pricing', url: '/pricing' },
        ])}
      />

      {/* Hero */}
      <header className="space-y-6 pt-6 sm:pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          pricing
        </p>
        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl">
          Free until we
          <br />
          earn the audience.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Discovery is free forever. Publishing is free in MVP.
        </p>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Phase 2 platform fee:{' '}
          <span className="font-mono font-semibold text-foreground">20%</span> flat. Founding
          cohort:{' '}
          <span className="font-mono font-semibold text-foreground">10%</span> for the first
          six months.{' '}
          <span className="text-foreground">Never per-install.</span>
        </p>
      </header>

      {/* Tier cards — sharp, no rounded inflation */}
      <section
        aria-label="Pricing tiers"
        className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-3"
      >
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={
              'relative flex flex-col gap-5 p-6 sm:p-8 ' +
              (tier.primary ? 'bg-foreground text-background' : 'bg-card')
            }
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{tier.name}</h2>
              <span
                className={
                  'font-mono text-[10px] uppercase tracking-wider ' +
                  (tier.primary ? 'text-background/60' : 'text-muted-foreground')
                }
              >
                {tier.priceMeta}
              </span>
            </div>

            <p className="font-mono text-4xl font-bold tracking-tight">{tier.price}</p>

            <p
              className={
                'flex-1 text-sm leading-relaxed ' +
                (tier.primary ? 'text-background/80' : 'text-muted-foreground')
              }
            >
              {tier.description}
            </p>

            <Link
              href={tier.cta.href}
              className={
                'mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px ' +
                (tier.primary
                  ? 'bg-background text-foreground'
                  : 'border border-foreground text-foreground hover:bg-foreground hover:text-background')
              }
            >
              {tier.cta.label} →
            </Link>
          </div>
        ))}
      </section>

      {/* Comparison */}
      <section aria-label="Tier comparison" className="space-y-6">
        <header className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold tracking-tight">What&apos;s included</h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            full breakdown
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  <span className="sr-only">Feature</span>
                </th>
                {TIERS.map((t) => (
                  <th
                    key={t.name}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-foreground"
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((group) => (
                <Fragment key={group.section}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="bg-muted/40 px-0 pb-2 pt-6 text-left font-mono text-[11px] uppercase tracking-wider text-brand"
                    >
                      {group.section}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-foreground">{row.feature}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-4 py-3">
                          <Cell value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footnote */}
      <section className="border-t border-border pt-8">
        <p className="max-w-2xl font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          how we make money
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A flat platform fee on paid agents — set per-tier, never per-install — so the long
          tail stays viable. Creators set their own price. We never take a cut of free agents.
        </p>
      </section>
    </div>
  );
}
