import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '../../components/JsonLd';
import { breadcrumbJsonLd } from '../../lib/jsonld';
import { SITE } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Discovering and installing agents on ${SITE.legalName} is free. Publishing is free in MVP; the creator-economy paid tier is coming with Phase 2.`,
  alternates: { canonical: '/pricing' },
};

interface Plan {
  name: string;
  badge?: string;
  price: string;
  cadence: string;
  description: string;
  cta: { label: string; href: string };
  highlight?: boolean;
  features: ReadonlyArray<string>;
}

const PLANS: ReadonlyArray<Plan> = [
  {
    name: 'Discover',
    price: '$0',
    cadence: 'forever',
    description:
      'Browse, install, and run any public agent. No account needed for read-only access.',
    cta: { label: 'Browse agents', href: '/agents' },
    features: [
      'One-command install via the CLI',
      'Search across every supported format',
      'Cross-tool: Claude Code, Cursor, Codex, Aider, Gemini',
      'Signed-manifest verification on every install',
      'No telemetry by default — opt-in only',
    ],
  },
  {
    name: 'Publish',
    badge: 'Most popular',
    price: '$0',
    cadence: 'in MVP',
    description:
      'Free for every creator while we earn the audience. Founding-creator program opens with Phase 2.',
    highlight: true,
    cta: { label: 'Publish your agent', href: '/publish' },
    features: [
      'Publish unlimited public agents',
      'Linter + manifest signing on every release',
      'Install metrics broken down by tool',
      'Verified-publisher review on request',
      'Founding-creator 90% revenue share when paid agents launch',
    ],
  },
  {
    name: 'Enterprise',
    badge: 'Phase 3',
    price: 'Talk to us',
    cadence: '',
    description:
      'Private and team registries with governance, SSO, audit log, and an on-prem option.',
    cta: { label: 'Get in touch', href: 'mailto:hello@datasetai.xyz' },
    features: [
      'Private/team registries with RBAC',
      'SSO (SAML, OIDC) and audit logs',
      'On-prem / air-gapped deployment option',
      'Automated security scanning of agent content',
      'Concierge onboarding for security review',
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="space-y-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Pricing', url: '/pricing' },
        ])}
      />

      <header className="space-y-4 pt-4 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-brand-500">
          Pricing
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Free until we earn the audience.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Discovery and installs are free forever. Publishing is free during MVP. The
          creator-economy paid tier launches with Phase 2 — founding creators get a 90% revenue
          share for six months.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              'relative flex flex-col rounded-xl border bg-card p-6 ' +
              (plan.highlight
                ? 'border-brand-500/60 shadow-[0_0_0_1px_oklch(0.66_0.18_200/0.4)]'
                : 'border-border')
            }
          >
            {plan.badge && (
              <span
                className={
                  'absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ' +
                  (plan.highlight
                    ? 'bg-brand-500 text-background'
                    : 'bg-muted text-muted-foreground')
                }
              >
                {plan.badge}
              </span>
            )}

            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.cadence && (
                  <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg
                    viewBox="0 0 16 16"
                    className="mt-1 size-3.5 shrink-0 text-brand-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.cta.href}
              className={
                'mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-opacity ' +
                (plan.highlight
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'border border-border bg-card text-foreground hover:border-brand-500/40')
              }
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-muted/40 p-6 sm:p-10">
        <h2 className="text-xl font-semibold tracking-tight">Why free now?</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          A registry is only useful if developers can actually find what they need. We are
          spending the MVP earning that — by indexing the catalog wide, by paying our own way
          on hosting, and by treating every creator like a founding contributor. Paid
          publishing only kicks in when there is a real audience to monetize against, and the
          first cohort keeps a 90% revenue share for the first six months.
        </p>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Pricing for paid agents is set by the creator. We take a flat platform fee — never a
          percentage of every install — to keep the long tail viable.
        </p>
      </section>
    </main>
  );
}
