# datasetai.xyz

> **npm for AI agents** — a format-agnostic registry where developers and prosumers upload AI agent definition files (Claude Skills, MCP servers, AGENTS.md, .cursorrules, system prompts) and others one-command install them into whichever AI tool they use.
>
> **Registry-only, not a runtime.** Agents run on the user's own LLM key, in their own tooling.

## Status

🚧 **Phase 0: Foundations.** Scaffolding only — see [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) for the 65-story Phase 1 (MVP) plan.

## Repo layout

```
datasetai/
├── apps/
│   ├── web/                # Next.js 15 — public web app + REST API (route handlers)
│   ├── worker/             # Background jobs (BullMQ on Fly.io)
│   └── cli/                # `datasetai` npm package — `npx datasetai install <agent>`
├── packages/
│   ├── core/               # Domain entities, types, Result<T, E>
│   ├── db/                 # Drizzle schema + migrations + queries (E1.2a/E1.2b)
│   ├── format-adapters/    # Claude-skill, MCP, AGENTS.md, .cursorrules adapters
│   ├── source-adapters/    # Auto-mirror sources (VoltAgent, Smithery, …)
│   ├── ui/                 # Shared React components (Tailwind 4 + shadcn primitives)
│   ├── api-client/         # Typed REST client (web + CLI consume)
│   └── config/             # Env validation (zod)
├── tooling/
│   ├── eslint/             # Shared ESLint flat configs (base, react, nextjs)
│   └── tsconfig/           # Shared TypeScript configs (base, nextjs, react-library)
├── _bmad-output/           # BMAD planning artifacts (research → readiness audit)
├── _bmad/                  # BMAD framework (gitignored — re-install via npx)
└── .claude/                # Claude Code skills (gitignored — re-install via npx)
```

## Dev setup

**Prereqs**

- Node ≥ 22 (`.nvmrc` → 22)
- pnpm ≥ 10 (auto-resolved via `packageManager` field; `corepack enable` if needed)
- Vercel CLI (`npm i -g vercel`) — used to pull DB credentials on first checkout

**Fresh-machine onboarding (clone → running dev server)**

```bash
git clone https://github.com/irmasemma/datasetai-final.git
cd datasetai-final
pnpm install
vercel login                                    # browser auth
vercel link --yes --project datasetai-final-web
vercel env pull apps/web/.env.local             # downloads dev branch DB URL
pnpm -F @datasetai/web dev                      # http://localhost:3006
```

Vercel is the source of truth for secrets — no env file is committed. Local dev
connects to a Neon "dev" branch (copy-on-write fork of production), so writes
never touch real user data. See [`CLAUDE.md`](CLAUDE.md) for the full
deployment topology, env-var routing, and Neon branch strategy.

**Common scripts**

```bash
pnpm dev            # turbo dev across all apps
pnpm build          # turbo build across the monorepo
pnpm typecheck      # tsc --noEmit across all workspaces
pnpm lint           # eslint across all workspaces
pnpm format         # prettier write
pnpm format:check   # prettier check (CI-friendly)
pnpm clean          # remove build artifacts + node_modules
```

**Per-app dev**

```bash
pnpm --filter @datasetai/web dev      # Next.js on http://localhost:3000
pnpm --filter @datasetai/worker dev   # BullMQ worker (TS hot-reload via tsx)
pnpm --filter datasetai dev           # CLI hot-reload via tsx
```

## Tech stack

- **Web:** Next.js 15 (App Router) + React 19 + Tailwind 4 + next-intl 3
- **Backend API:** Next.js Route Handlers (REST) — no separate service for v1 ([Architecture AD-1](_bmad-output/planning-artifacts/architecture.md))
- **Worker:** Node + BullMQ (Upstash Redis) on Fly.io
- **CLI:** TypeScript via `npx datasetai`, signed with npm provenance
- **DB:** Postgres (Neon) + Drizzle ORM
- **Search:** Meilisearch Cloud
- **Storage:** Cloudflare R2 (S3-compatible, zero egress)
- **Auth:** Auth.js v5 (GitHub OAuth + email magic links)
- **Payments (Phase 2):** Stripe Connect Express
- **Observability:** PostHog + Sentry + Axiom + Better Uptime

## Planning artifacts

The complete pre-build planning suite lives in [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/):

| Document | Purpose |
| --- | --- |
| [`research/market-llm-agent-marketplace-research-2026-05-02.md`](_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md) | Market research, competitor teardown, three-wave demand analysis |
| [`product-brief-datasetai-2026-05-02.md`](_bmad-output/planning-artifacts/product-brief-datasetai-2026-05-02.md) | Executive 1–2 page brief |
| [`prd.md`](_bmad-output/planning-artifacts/prd.md) | PRD — 47 FRs + 38 NFRs |
| [`architecture.md`](_bmad-output/planning-artifacts/architecture.md) | 15 ADRs, system diagram, cost model |
| [`epics.md`](_bmad-output/planning-artifacts/epics.md) | 7 epics, 65 sprintable stories with Gherkin AC |
| [`supply-bootstrap-plan-2026-05-02.md`](_bmad-output/planning-artifacts/supply-bootstrap-plan-2026-05-02.md) | 12-week pre-launch supply plan |
| [`implementation-readiness-report-2026-05-02.md`](_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-02.md) | Pre-build audit + post-fix status |

## License

TBD — to be selected before public launch (Architecture §6.4 / NFR-LGL).
