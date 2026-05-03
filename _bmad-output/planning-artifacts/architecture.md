---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-datasetai-2026-05-02.md'
  - '_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md'
  - '_bmad-output/planning-artifacts/supply-bootstrap-plan-2026-05-02.md'
documentCounts:
  prdCount: 1
  briefCount: 1
  researchCount: 1
  supplyPlanCount: 1
  uxCount: 0
  projectDocsCount: 0
projectType: 'greenfield'
workflowType: 'architecture'
project_name: 'datasetai.xyz'
user_name: 'Semma'
date: '2026-05-02'
arch_version: 'v0.1 — yolo draft, ready for review'
mode: 'yolo'
---

# Architecture Decision Document — datasetai.xyz

**Author:** Semma
**Date:** 2026-05-02
**Version:** v0.1 (yolo draft)
**Status:** Draft — pre-implementation

> _Cross-references: This document satisfies the requirements specified in [prd.md](./prd.md). Numeric requirement labels (FR-/NFR-) refer to that PRD's §9–10._

---

## 1. Project Context

### 1.1 What we're building (one paragraph)

A two-surface platform — **a web registry** and a **CLI installer** — backed by a small set of services. Users browse and install agent definition files (Claude Skills, MCP servers, and Phase-2 formats) without datasetai ever running the agents. The platform's job is to *discover, store, version, attribute, search, install, and (Phase 2) monetize* agent files.

### 1.2 Architectural drivers (in priority order)

1. **Speed of iteration** — small team, must ship Phase 1 in 6 months. *Heavily favors monolith-leaning, vendor-managed services, conventional choices.*
2. **CLI-as-product** — CLI must be reliable, fast, and decoupled from the web app's uptime.
3. **Format-extensibility** — Phase 1 supports 2 formats; Phase 2 must absorb 5+ more without refactor.
4. **Auto-mirror at scale with attribution integrity** — must ingest tens of thousands of upstream items, dedupe, attribute, version, and respect suppression — without manual ops.
5. **Software-margins economics** — pick services that are cheap at 25K MAU and only get expensive at 1M+ MAU.
6. **Cross-platform CLI** (macOS, Linux, Windows) — install must just work.
7. **No hosted agent runtime ever** — minimizes blast radius for security and cost.
8. **Phase-2 readiness** — payments, cross-format expansion, private registries — design hooks now, gate behind feature flags.

### 1.3 Architectural non-goals

- ❌ Microservices day one
- ❌ Multi-region active-active
- ❌ Real-time / WebSockets at MVP
- ❌ Hosted LLM inference
- ❌ Custom evaluation infrastructure (Phase 3)
- ❌ Mobile app

### 1.4 Key constraints carried from the PRD

- 99.5% web availability (consumer-grade)
- p95 < 1.5s catalog load, < 500ms search, < 5s CLI install
- 100K MAU + 1M monthly install events as MVP-launch *capacity*; cost-optimized for 25K MAU baseline
- WCAG 2.1 AA, GDPR/CCPA compliant
- WCAG keyboard-only navigation
- Architecture must support i18n (Russian, Spanish, German, Japanese, Mandarin in Phase 2)

---

## 2. Starter Templates & Framework Choices

### 2.1 Frontend / Web — **Next.js 15 (App Router)**

- ✅ SSR + ISR for SEO (catalog and listing pages must rank)
- ✅ Mature React ecosystem, deep talent pool
- ✅ Vercel deploys = ~zero ops
- ✅ Server components reduce client-bundle size for catalog browsing
- ✅ App-Router built-in i18n routing pairs with `next-intl`

**Alternatives considered:** Remix (rejected — smaller ecosystem; Next.js's i18n + ISR fits marketplace UX better); Astro (rejected — too static-leaning for our publishing/dashboard surfaces).

### 2.2 Backend API — **Next.js Route Handlers (no separate service for v1)**

- ✅ One codebase, one deploy, one set of types end-to-end
- ✅ Server components + route handlers cover ~90% of API needs
- ✅ Vercel functions handle this well at our scale
- 🔄 Phase-2 split: extract heavy endpoints into a dedicated Node service if/when latency or cost demands

**Alternatives considered:** dedicated Node/Fastify service (rejected for v1 — unnecessary boundary cost); Go service (rejected — adds language barrier in a TypeScript monorepo without proportionate benefit at this scale).

### 2.3 CLI — **TypeScript + npm + `npx`-distributed**

- ✅ `npx datasetai install <agent>` — zero install friction (PRD's BMAD installer pattern)
- ✅ Cross-platform without per-OS binaries
- ✅ Easy CI/CD (npm publish + provenance signing)
- ✅ Shared TypeScript types/format-adapters between server and CLI via internal packages
- 🔄 Phase 2: optional Homebrew/Scoop release for users who want a persistent install

### 2.4 Background workers — **separate Node service on Fly.io running BullMQ**

- ✅ Decoupled from web app (mirror jobs can run for hours without blocking requests)
- ✅ BullMQ is TypeScript-native, mature, has a UI dashboard (Bull Board)
- ✅ Fly.io is cheap, simple, and runs long-lived workers naturally
- 🔄 Phase 2: consider Inngest (typed event-driven workflows) for new workflows

**Alternatives considered:** Vercel Cron (rejected — too time-bounded for ingestion jobs); Inngest from day one (rejected — extra vendor surface for v1).

### 2.5 Database — **Postgres (Neon serverless)**

- ✅ Postgres is the single-best choice for marketplace-shaped data
- ✅ Neon: serverless, branchable per-PR, cheap at idle, scale-to-zero
- ✅ Drizzle ORM gives us SQL transparency without the abstraction tax
- 🔄 Phase 3: consider read replicas if catalog reads outgrow primary

**Alternatives considered:** Supabase (also great — slightly heavier feature footprint we don't need); RDS (rejected — operational overhead).

### 2.6 ORM — **Drizzle**

- ✅ TypeScript-first, generates types from schema
- ✅ Lightweight, predictable SQL output
- ✅ Easy migrations
- ✅ Edge-runtime friendly (matters for Vercel functions)

**Alternatives considered:** Prisma (rejected — heavier query engine, less SQL transparency); Kysely (rejected — less mature ecosystem for marketplace-shape projects).

### 2.7 Search — **Meilisearch (managed via Meilisearch Cloud)**

- ✅ Out-of-the-box typo tolerance, faceted search, fast filtering
- ✅ ~$30/month at our scale; predictable pricing
- ✅ Open-source self-host fallback if vendor concern
- ✅ JSON-document-shaped, perfect for listings

**Alternatives considered:** Postgres FTS (rejected — explicit PRD note: not enough at 10K+ listings); Algolia (rejected — fastest but priciest); Typesense (close runner-up, slightly less mature managed offering).

### 2.8 Object storage — **Cloudflare R2**

- ✅ S3-compatible API (zero lock-in)
- ✅ **No egress fees** — critical when CLI is downloading agent files millions of times
- ✅ Pairs natively with Cloudflare CDN
- ✅ Cheaper than S3 at any meaningful scale

**Alternatives considered:** S3 (rejected — egress costs eat margins); Backblaze B2 (also strong, slightly less mature CDN integration).

### 2.9 CDN — **Cloudflare**

- ✅ Pairs with R2 zero-egress story
- ✅ Free tier covers MVP comfortably
- ✅ Bot management + DDoS protection inclusive

### 2.10 Auth — **Auth.js v5 (next-auth)**

- ✅ GitHub OAuth + email magic links day 1
- ✅ Drop-in to Next.js 15 App Router
- ✅ Free
- 🔄 Phase 3 enterprise SSO (SAML/OIDC): switch to Clerk or WorkOS as a clean migration

### 2.11 Payments (Phase 2) — **Stripe Connect Express**

- ✅ Stripe handles tax (Stripe Tax), KYC, payouts to ~50 countries
- ✅ Express accounts = lowest-friction creator onboarding
- 🔄 Crypto/platform-wallet fallback for excluded countries — research in Phase 2 (PRD §14 Q4)

### 2.12 Email — **Resend**

- ✅ Cheap, deliverable, modern API
- ✅ React-email components for transactional templates

### 2.13 Observability — **PostHog + Sentry + Axiom**

- **PostHog** — product analytics, feature flags, session replay (events: install_attempted, install_succeeded, install_failed, search, listing_view, publish, claim, report_listing)
- **Sentry** — error tracking with deploy-tagging (web, worker, CLI all report)
- **Axiom** — structured log aggregation (cheap at indie scale)

### 2.14 Background queue — **BullMQ + Upstash Redis**

- ✅ Upstash: serverless Redis, scale-to-zero, no ops
- ✅ BullMQ runs natively against it
- ✅ Bull Board admin UI for free

### 2.15 Hosting summary

| Surface | Host |
|---|---|
| Web (Next.js) | Vercel |
| Worker (Node + BullMQ) | Fly.io |
| Postgres | Neon |
| Redis | Upstash |
| Object storage | Cloudflare R2 |
| CDN | Cloudflare |
| Search | Meilisearch Cloud |
| Email | Resend |

**Estimated monthly infra cost at 25K MAU:** $150–$400. At 100K MAU: $500–$1,500. (Software margins from day one — promised in the brief.)

---

## 3. Architectural Decisions (ADR style)

> Each decision is numbered (`AD-N`) and traceable to PRD requirements.

### AD-1 — Modular monolith (not microservices)

**Decision.** One Next.js app for web + API; one worker service for background jobs; one CLI npm package. Shared code via pnpm workspace packages.

**Rationale.** PMF risk dwarfs scaling risk at v1. Microservices would slow iteration; the platform's hard problems are *product and supply*, not *distributed systems*. Sharing types end-to-end (frontend ↔ API ↔ CLI) is a competitive advantage on dev velocity.

**Trade-off.** Eventually we'll split heavy endpoints (search, install) into a dedicated service when latency or cost demands. Designing route handlers as thin adapters over service-layer code makes that split mechanical.

**Satisfies.** PRD §7.2, NFR-SCL-1..3.

---

### AD-2 — Format-adapter plugin architecture

**Decision.** Every format (Claude Skill, MCP server, AGENTS.md, .cursorrules, …) implements a `FormatAdapter` interface. Adapters live in a shared `@datasetai/format-adapters` package consumed by both server and CLI.

```ts
interface FormatAdapter {
  id: FormatId;                                  // 'claude-skill', 'mcp-server', ...
  detect(files: AgentFile[]): boolean;           // recognize this format
  validate(content: AgentContent): ValidationResult;
  install(content: AgentContent, target: ToolTarget): Promise<InstallResult>;
  toolCompatibility(): Tool[];                   // which Tools accept this format
  exportFor?(content: AgentContent, tool: Tool): AgentContent;  // optional cross-tool conversion
}
```

The CLI's install resolver:
1. Resolves the agent version's primary format
2. Looks up the user's local Tool (auto-detect)
3. Asks the FormatAdapter to install — which writes to the right folder

**Rationale.** Phase-1 ships 2 adapters. Phase 2 adds 5+ — but the surface area to extend is one file per format. Cross-tool export (e.g. `--tool=cursor` for a `claude-skill` agent) is an *optional* method per adapter so we can add it gradually.

**Trade-off.** Versioning of the adapter contract becomes load-bearing; changing it is a CLI breaking change. Mitigated by a versioned interface and adapter-version field in agent manifests.

**Satisfies.** PRD §3 anti-goals, FR-INC-1..6, FR-PUB-3, FR-PUB-8.

---

### AD-3 — Source-adapter plugin architecture for auto-mirror

**Decision.** Mirror sources implement a `SourceAdapter`:

```ts
interface SourceAdapter {
  id: SourceId;                                  // 'voltagent', 'smithery', 'github-mirror', ...
  fetch(): AsyncGenerator<RawAgent>;             // paginated, resumable
  attribution(item: RawAgent): Attribution;      // upstream URL, author, source name
  license(item: RawAgent): License;              // SPDX-style if known
  contentHash(item: RawAgent): string;           // SHA-256 for idempotency
}
```

Mirror jobs are scheduled by BullMQ cron. Each adapter is its own job. Idempotency via content hash + (source, upstream-id) primary key.

**Rationale.** Mirror sources are wildly heterogeneous (a GitHub awesome-list, a Smithery API, a JSON dump). A common interface keeps the worker generic.

**Trade-off.** Adapters have to deal with upstream rate limits and shape changes. Each adapter ships with a dedicated test suite and a "dry-run" mode for safe iteration.

**Satisfies.** FR-MIR-1..6, R-5 (auto-mirror legal/social posture).

---

### AD-4 — Content-addressable, immutable AgentVersion storage

**Decision.** Every published `AgentVersion` is content-hashed (SHA-256 of a deterministic tarball of its files). The hash is the R2 object key. Postgres stores `(agent_id, version, content_hash)`. Edits to non-content fields (description, tags) update the listing record but not the AgentVersion.

**Rationale.**
- **Reproducibility.** Two installs of the same `<agent>@<version>` always get the same bytes.
- **Cache-friendliness.** Content URL is permanently cacheable at the CDN edge (immutable URL).
- **Cheap dedup.** Identical content across mirrors stores once.
- **Audit/integrity.** Trust badges and signature verification map cleanly to content hashes.

**Trade-off.** Re-publishing identical content costs nothing but the listing UX must explicitly show "same content, new version" in some cases. Acceptable.

**Satisfies.** FR-PUB-5, FR-PUB-7, NFR-REL-3.

---

### AD-5 — CLI does not depend on the web app being up

**Decision.** Agent install metadata and content are served from Cloudflare CDN, not the Next.js app. Each `AgentVersion` has:
- A static JSON manifest at `cdn.datasetai.xyz/agents/<id>/<version>.json`
- Content tarball at `cdn.datasetai.xyz/content/<sha256>.tar.gz`

Both URLs are immutable. The CLI fetches manifest → fetches content → writes locally. Web app downtime affects browsing/publishing/dashboards, but **not installs.**

**Rationale.** PRD NFR-REL-2: "CLI install does not require the web app to be up." This is the *most important* reliability decision in the system. Installs are the hot path; everything else can be down for an hour without the brand suffering.

**Implementation note.** Manifest publishing is part of the publish-pipeline: when a publish completes, a worker writes the manifest to R2 with `Cache-Control: public, immutable, max-age=31536000`. CDN purge only needed if a version is unpublished/suppressed — purge by URL.

**Trade-off.** Listing edits (description, tags) require a manifest re-publish — adds ~5 sec latency to "edit metadata" UX. Acceptable.

**Satisfies.** NFR-REL-2, NFR-PRF-4.

---

### AD-6 — Tool auto-detection by filesystem heuristics

**Decision.** CLI auto-detects local AI tools via filesystem inspection in priority order:

```
Priority    Marker                           Tool
1           ./.claude/                       claude-code
2           ./.cursor/  or ./.cursorrules    cursor
3           ./AGENTS.md  or ./agents.md      cross-tool (Codex/Aider/...)
4           ./codex/                         codex-cli
5           ./.aider.conf.yml                aider
6           $HOME/.config/<tool>/...         system-installed clients
7           interactive prompt (fallback)    ask user
```

Multi-tool: `--tool=cursor,claude-code` skips detection.

**Rationale.** Most users have one obvious primary tool per project. Filesystem heuristics are reliable, no daemon required.

**Trade-off.** Requires keeping the priority table current as new tools emerge. Tabled for Phase-2 expansion.

**Satisfies.** FR-INC-2, FR-INC-4, FR-INC-5.

---

### AD-7 — Search via Meilisearch with Postgres as source of truth

**Decision.** Postgres is the system of record for listings, versions, creators. A small change-data pipeline (Postgres → Meilisearch via a worker job triggered on listing/version change) keeps Meilisearch up to date.

**Rationale.** Postgres FTS does not handle typo tolerance or faceted search well at scale. Meilisearch ships these in the box. Keeping Postgres as source of truth means search is rebuildable from scratch in minutes.

**Trade-off.** Eventual consistency between Postgres and Meilisearch (target: sub-second lag). Acceptable — search index lag is industry norm.

**Satisfies.** FR-DSC-2, FR-DSC-3, NFR-PRF-2.

---

### AD-8 — Auth.js v5 with GitHub OAuth as the primary creator auth

**Decision.** Two providers in v1:
- **GitHub OAuth** — required for all creators (also serves as the proof-of-ownership for "claim listing")
- **Email magic-link** — for browse-only / consumer accounts

The same Auth.js session covers both. Account linking via verified email.

**Rationale.** GitHub OAuth is a frictionless signal we can use for both auth and repo-ownership verification (FR-MIR-3, FR-PUB-1). Email is the lowest-friction onramp for non-creators.

**Trade-off.** Account-linking edge cases (a user has two GitHub accounts mapped to one email). Handled with explicit account-merge UX. Acceptable.

**Satisfies.** FR-PUB-1, FR-MIR-3, NFR-PRV-3.

---

### AD-9 — Anonymous CLI telemetry, opt-out by env var

**Decision.** CLI emits anonymous install events to a public endpoint `cdn.datasetai.xyz/telemetry` (CDN-fronted to avoid web-app dependency, AD-5). Events: `agent_id`, `version`, `tool_detected`, `success` boolean, `error_code` if failed, anonymous `install_id` (UUID generated once on first run, stored in `~/.datasetai/install-id`). No PII. `DATASETAI_TELEMETRY=0` disables. Documented prominently in the CLI's first-run banner.

**Rationale.** PRD FR-INC-12 requires this. Anonymous install-id lets us de-duplicate without identifying users. Aggregated in PostHog for dashboards.

**Trade-off.** Some users will object on principle. The opt-out mechanism is documented and respected.

**Satisfies.** FR-INC-12, NFR-PRV-2.

---

### AD-10 — Stripe Connect Express (Phase 2, designed-for-now)

**Decision.** Even though paid-agents are Phase 2, the schema includes:
- `creator.stripe_connect_account_id` (nullable)
- `agent_version.price_cents` (nullable)
- `install.payment_intent_id` (nullable)

The MVP API guards monetization endpoints behind a feature flag (`MONETIZATION_ENABLED=false`). Switching to paid mode in Phase 2 is configuration, not migration.

**Rationale.** The PRD commits to Phase 2 monetization. Schema is cheap; backfill migrations are expensive. Pre-bake the schema.

**Trade-off.** Carrying nullable columns until Phase 2. Trivial cost.

**Satisfies.** PRD §15 Phase 2, brief §3.1 monetization.

---

### AD-11 — i18n from day 1 via `next-intl`

**Decision.** No hardcoded UI strings. All UI text in `messages/en.json` (and per-locale files added later). Locale routing via Next.js App Router (`/en/...`, `/ru/...`).

**Rationale.** PRD NFR-I18N-1 requires architecture support. Retrofitting i18n is famously painful; adding it day-1 costs ~5% extra dev effort.

**Trade-off.** Slightly more verbose component code (`t('catalog.search.placeholder')` vs raw string). Acceptable.

**Satisfies.** NFR-I18N-1, NFR-I18N-2.

---

### AD-12 — Suppression list as a first-class entity

**Decision.** A Postgres `suppression` table stores `(scope, target, reason, requested_at, status)`. Both ingestion jobs and the publish pipeline check it. A `scope` of `(source, upstream_id)` blocks specific listings; `(source, *)` blocks an entire upstream source globally; `(creator, *)` blocks all listings from a creator (admin-only).

**Rationale.** PRD R-5 + FR-MIR-4 require a documented, fast (≤72h SLA) suppression flow. First-class modeling makes this enforceable, queryable, and auditable.

**Trade-off.** Adds a check to the hot publish path. Postgres index makes it sub-millisecond.

**Satisfies.** FR-MIR-4, R-5.

---

### AD-13 — Verified-publisher review as a manual queue (MVP)

**Decision.** Verified-publisher is a manual review process backed by a Postgres-backed admin queue. Phase 3 introduces automated security scans + sandboxed evals; until then, this is human review.

**Rationale.** "Build the manual version that scales to 100, then automate" — common indie pattern. PRD §10.4 NFR-SEC-6 explicitly defers automation to Phase 3.

**Trade-off.** Doesn't scale past ~50 reviews/week. Acceptable until Phase 3.

**Satisfies.** FR-TRS-1, FR-TRS-2.

---

### AD-14 — One staging environment per Vercel preview, isolated DB branch per PR via Neon

**Decision.** Every PR gets a Vercel preview deploy and a Neon DB branch. Test data is seeded from a deterministic fixture set on PR open.

**Rationale.** Decouples team velocity. Reviewers see real running code with clean data. Free at our scale (Neon's free tier covers branch DBs).

**Trade-off.** Requires CI/CD setup work upfront. Done once, paid forever.

---

### AD-15 — Result types in core, exceptions only at boundaries

**Decision.** Domain logic returns `Result<T, E>` (or similar). Exceptions are reserved for genuinely exceptional, unrecoverable conditions (DB connection lost, OOM). Every endpoint and CLI command catches at the outermost boundary and converts to a structured response.

**Rationale.** Predictable error handling, no try/catch noise inside business logic, clean error messages out to users and CLI consumers.

**Trade-off.** TypeScript without explicit Result types is more ergonomic, but the discipline pays back the moment a third hand-rolled error path bites.

---

## 4. Patterns

### 4.1 Repository structure

**pnpm workspaces + Turborepo.** Single repo, multiple packages.

```
datasetai/
  apps/
    web/                     # Next.js 15 — UI + API routes
      app/
        (marketing)/         # public marketing pages
        (catalog)/           # browsing + listing details
        (account)/           # logged-in account, dashboard, publishing
        (admin)/             # admin queue (gated)
        api/                 # route handlers (REST)
      components/
      lib/
      messages/              # i18n strings
      tests/
    worker/                  # background jobs (BullMQ)
      src/jobs/
        mirror-voltagent.ts
        mirror-smithery.ts
        mirror-skillsmp.ts
        ...
        rebuild-search-index.ts
        publish-manifest.ts
      src/lib/
      tests/
    cli/                     # 'datasetai' npm package (or @datasetai/cli)
      src/
        commands/            # install, search, list, uninstall, publish, login
        adapters/            # references @datasetai/format-adapters
        lib/
      bin/datasetai.ts
      tests/

  packages/
    core/                    # domain entities, types, Result<T,E>
    db/                      # Drizzle schema + migrations + queries
    format-adapters/         # FormatAdapter implementations
      src/
        claude-skill.ts
        mcp-server.ts
        agents-md.ts          # Phase 2
        cursorrules.ts        # Phase 2
        index.ts              # registry
    source-adapters/         # SourceAdapter implementations
      src/
        voltagent.ts
        smithery.ts
        skillsmp.ts
        prompts-chat.ts
        github-mirror.ts
        index.ts
    ui/                      # shared React components (Tailwind + shadcn/ui)
    api-client/              # typed client for web → API and CLI → API
    config/                  # env validation (zod)

  tooling/
    eslint/
    tsconfig/
    tailwind/

  .github/workflows/         # CI: build, test, type-check, deploy
  docs/                      # internal docs (architecture/, runbooks/)
```

### 4.2 API style — REST via Next.js Route Handlers

- `/api/v1/agents`                    — list + filter
- `/api/v1/agents/:id`                — listing detail
- `/api/v1/agents/:id/versions/:v`    — version detail
- `/api/v1/install`                   — log install event (CLI → server)
- `/api/v1/publish`                   — direct upload (web + CLI)
- `/api/v1/listings/:id/claim`        — claim flow
- `/api/v1/listings/:id/report`       — report listing
- `/api/v1/me/agents`                 — creator's own listings (auth)
- `/api/v1/me/installs`               — user's installed agents (auth — Phase 2 cross-device)
- `/api/v1/admin/...`                 — admin queue (gated)

REST chosen over tRPC: simpler CLI consumer story, easier external integrations later (Phase 3 SDK).

### 4.3 Versioning of public APIs

`/api/v1/...` from day 1. Breaking changes in Phase 2+ go to `/api/v2/...`; v1 stays alive for ≥6 months after v2.

### 4.4 Caching strategy

| Surface | Cache layer | TTL | Invalidation |
|---|---|---|---|
| Agent manifests (`/agents/<id>/<v>.json`) | Cloudflare CDN | Immutable (1y) | Purge on unpublish only |
| Agent content (`/content/<sha>.tar.gz`) | Cloudflare CDN | Immutable | Never (content-addressed) |
| Catalog API (`/api/v1/agents`) | Cloudflare CDN + Vercel ISR | 60s | Webhook on listing changes |
| Listing detail | Vercel ISR | 60s | Webhook on update |
| Search results | None (live Meilisearch) | – | – |
| Auth-gated dashboards | None | – | – |

### 4.5 Database access pattern

- All queries through Drizzle in `packages/db/src/queries/`
- Service-layer functions in `packages/core/` (or a thin `apps/web/lib/services/`) own business logic
- Route handlers are thin: parse → call service → format response

### 4.6 Background jobs pattern

- Cron-scheduled jobs (mirrors) defined in `apps/worker/src/jobs/cron.ts`
- Event-driven jobs (e.g. `publish-manifest`) triggered from API routes via BullMQ enqueue
- Every job logs structured events (PostHog + Axiom) and ships errors to Sentry
- Idempotency by content hash; resumable via cursor in job data

### 4.7 Error handling

- Domain logic returns `Result<T, E>` (`@datasetai/core`)
- Boundaries (route handlers, CLI commands) catch and serialize
- User-facing error codes documented in `docs/error-codes.md`

### 4.8 Feature flags

- PostHog feature flags for gradual rollout (e.g. `monetization_enabled`, `cross_tool_install_enabled`)
- Cheap and reversible for risky launches (founding-creator program rollout, Phase 2 paid agents)

### 4.9 Telemetry event taxonomy (PostHog)

Events live in `packages/core/src/events.ts`:
- `search_performed` — query, filters, result_count
- `listing_viewed` — listing_id, source, referrer
- `install_attempted` — agent_id, version, tool_detected, format
- `install_succeeded` — same + duration_ms
- `install_failed` — same + error_code
- `agent_published` — agent_id, format, source (web/cli)
- `listing_claimed` — agent_id, creator_id
- `report_submitted` — agent_id, reason

### 4.10 Security patterns

- All routes input-validated via Zod schemas
- Rate limits at Vercel edge (auth, publish, report endpoints — token-bucket per IP)
- CSRF protection on state-changing routes (Auth.js handles)
- Secrets via Vercel env vars; rotated per quarter
- npm publish uses provenance + 2FA (CLI security)
- Content-Security-Policy strict on web app
- No user-uploaded code is ever executed server-side

### 4.11 Observability

- Sentry: every unhandled error tagged with deploy SHA, route, user (if authed)
- PostHog: every event in §4.9, plus session replays on a 1% sample
- Axiom: structured logs from worker, web (server-side), CLI errors
- Status page (statuspage.io free tier) auto-polls catalog, search, install endpoints

### 4.12 Internationalization

- `next-intl` for i18n routing + message catalogs
- Server components fetch translations from `packages/core/messages/<locale>.json`
- Listing content is preserved in author-supplied language; UI chrome translates

### 4.13 Accessibility

- shadcn/ui (built on Radix primitives) — WCAG-AA defaults
- Catalog and listing pages: keyboard-navigable
- Lighthouse a11y score ≥ 95 on key pages enforced in CI

---

## 5. System Structure

### 5.1 High-level component diagram

```
                                      ┌──────────────────┐
                                      │  Cloudflare CDN  │
                                      │ (R2 + manifests) │
                                      └─────────▲────────┘
                                                │
                ┌───────────────────────────────┼───────────────────────────────┐
                │                               │                               │
                │                       Static assets &                         │
                │                       agent manifests                         │
                │                                                               │
   ┌────────────▼─────────────┐                                  ┌──────────────▼──────────────┐
   │       Web (Vercel)       │                                  │     CLI (npm / npx)         │
   │ Next.js 15 App + API     │                                  │  TypeScript binary          │
   │ - Catalog browse         │                                  │  - install / search / publish│
   │ - Listing detail (SSR)   │                                  │  - format-adapter resolution │
   │ - Search (→ Meilisearch) │◄────────── REST ────────────────►│  - tool auto-detection       │
   │ - Publish / Claim flows  │                                  │  - telemetry (anon)          │
   │ - Creator dashboard      │                                  └─────────────────────────────┘
   │ - Admin queue            │
   │ - Auth (Auth.js v5)      │
   └────┬────────┬─────────┬──┘
        │        │         │
   reads/        │         │ enqueues
   writes        │         │ jobs
        │        │         │
        ▼        ▼         ▼
   ┌────────┐ ┌──────────┐ ┌──────────────────────────┐
   │ Neon   │ │Meilisearch│ │ Worker (Fly.io)          │
   │ Postgres│ │  Cloud   │ │  - BullMQ jobs           │
   └────┬───┘ └────▲─────┘ │  - Mirror sources        │
        │          │       │  - Publish-manifest job  │
        │     index sync   │  - Search index sync     │
        │          │       │  - Suppression sweeper   │
        └──────────┴───────┤  - Reads/writes Postgres │
                           │  - Writes manifests → R2 │
                           └──────┬───────────────────┘
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │  Cloudflare R2       │
                      │  (object storage)    │
                      │  - content tarballs  │
                      │  - manifests         │
                      └──────────────────────┘

      ┌──────────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
      │ Stripe Connect (Phase 2) │  │ Resend (email)   │  │ Upstash Redis    │
      │  - Creator payouts       │  │ - Magic links    │  │ - BullMQ queue   │
      └──────────────────────────┘  │ - Notifications  │  │ - Sessions       │
                                    └──────────────────┘  └──────────────────┘
```

### 5.2 Database schema (high-level)

> Full schema lives in `packages/db/src/schema/`. Below is the minimum viable shape.

```sql
-- Creators (and admin users)
CREATE TABLE users (
  id                   UUID PRIMARY KEY,
  email                CITEXT UNIQUE NOT NULL,
  github_id            BIGINT UNIQUE,
  github_login         TEXT,
  display_name         TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  is_verified_publisher BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin             BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_connect_account_id TEXT,         -- Phase 2
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- Listings (one per agent; mirrored or directly published)
CREATE TABLE agents (
  id                   TEXT PRIMARY KEY,           -- slugified, e.g. 'voltagent/code-reviewer'
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  long_description     TEXT,
  category             TEXT,
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  primary_format       TEXT NOT NULL,              -- 'claude-skill' | 'mcp-server' | ...
  formats              TEXT[] NOT NULL,            -- multi-format support
  tool_compatibility   TEXT[] NOT NULL,            -- ['claude-code', 'cursor', ...]
  license              TEXT,                       -- SPDX id
  source_type          TEXT NOT NULL,              -- 'direct-publish' | 'github-mirror' | 'voltagent-mirror' | ...
  source_url           TEXT,                       -- upstream URL when mirrored
  source_attribution   JSONB,
  creator_id           UUID REFERENCES users(id),  -- NULL when unclaimed
  current_version      TEXT NOT NULL,              -- e.g. '1.4.0'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unpublished_at       TIMESTAMPTZ,
  install_count_lifetime BIGINT NOT NULL DEFAULT 0,
  install_count_30d    BIGINT NOT NULL DEFAULT 0,
  search_rank          REAL NOT NULL DEFAULT 0     -- precomputed for tie-breaking
);
CREATE INDEX agents_search_rank_idx ON agents (search_rank DESC) WHERE unpublished_at IS NULL;
CREATE INDEX agents_creator_idx ON agents (creator_id);
CREATE INDEX agents_source_idx ON agents (source_type, source_url);

-- Versions (immutable)
CREATE TABLE agent_versions (
  agent_id             TEXT NOT NULL REFERENCES agents(id),
  version              TEXT NOT NULL,              -- SemVer-ish
  content_hash         TEXT NOT NULL,              -- SHA-256, used as R2 key
  content_size_bytes   BIGINT NOT NULL,
  manifest_url         TEXT NOT NULL,              -- CDN URL
  content_url          TEXT NOT NULL,              -- CDN URL
  changelog            TEXT,
  format               TEXT NOT NULL,
  price_cents          INT,                        -- NULL = free; Phase 2
  published_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unpublished_at       TIMESTAMPTZ,
  PRIMARY KEY (agent_id, version)
);
CREATE INDEX agent_versions_published_idx ON agent_versions (agent_id, published_at DESC);

-- Installs (telemetry)
CREATE TABLE installs (
  id                   BIGSERIAL PRIMARY KEY,
  agent_id             TEXT NOT NULL,
  version              TEXT NOT NULL,
  install_id           TEXT,                       -- anonymous CLI install_id (UUID)
  user_id              UUID REFERENCES users(id),  -- web-side or authed CLI; NULL otherwise
  tool_detected        TEXT,
  format               TEXT,
  success              BOOLEAN NOT NULL,
  error_code           TEXT,
  user_agent           TEXT,
  ip_country           TEXT,                       -- coarse geo only
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX installs_agent_idx ON installs (agent_id, created_at DESC);
CREATE INDEX installs_install_id_idx ON installs (install_id);

-- Suppression list
CREATE TABLE suppressions (
  id                   UUID PRIMARY KEY,
  scope                TEXT NOT NULL,              -- 'source' | 'creator' | 'listing'
  source_type          TEXT,
  source_url           TEXT,
  agent_id             TEXT,
  creator_id           UUID,
  reason               TEXT NOT NULL,
  requested_by         TEXT,                       -- email/handle of requester
  status               TEXT NOT NULL DEFAULT 'active', -- active | revoked
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ
);
CREATE INDEX suppressions_active_idx ON suppressions (status, scope);

-- Reports (admin queue)
CREATE TABLE reports (
  id                   UUID PRIMARY KEY,
  agent_id             TEXT NOT NULL,
  reporter_user_id     UUID REFERENCES users(id),
  reporter_email       CITEXT,
  reason               TEXT NOT NULL,              -- 'malware' | 'copyright' | 'spam' | ...
  details              TEXT,
  status               TEXT NOT NULL DEFAULT 'pending', -- pending | reviewing | resolved | dismissed
  resolved_by          UUID REFERENCES users(id),
  resolution_note      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ
);

-- Verified-publisher applications
CREATE TABLE verification_applications (
  id                   UUID PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES users(id),
  github_handle        TEXT NOT NULL,
  reasoning            TEXT,
  status               TEXT NOT NULL DEFAULT 'pending',
  reviewed_by          UUID REFERENCES users(id),
  reviewer_note        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at          TIMESTAMPTZ
);

-- Sessions (Auth.js managed; included for completeness)
-- ...
```

### 5.3 CLI command surface (v1)

```
datasetai install <agent-id>[@version] [--tool=<tool>[,<tool>...]] [--format=<format>]
datasetai search <query> [--format=<format>] [--tool=<tool>] [--limit=<n>]
datasetai list                          # in current project
datasetai uninstall <agent-id> [--tool=<tool>]
datasetai update [<agent-id>]
datasetai publish [<path>] [--draft]
datasetai login                         # opens browser to OAuth flow
datasetai logout
datasetai whoami
datasetai version
datasetai help [<command>]
```

Per the PRD review note, **`update` and `publish`-from-CLI are stretch for v1** — implement only if time allows; otherwise web-publish + CLI install is sufficient for the MVP. Decision deferred to engineering, captured here as a flag.

### 5.4 Deployment topology

| Environment | Purpose | URL |
|---|---|---|
| `production` | Live customers | `datasetai.xyz` + `cdn.datasetai.xyz` |
| `staging` | Pre-prod soak | `staging.datasetai.xyz` |
| Per-PR previews | Vercel preview + Neon DB branch | auto-generated URL |
| `local` | Devs | `localhost:3000`, Docker compose for Postgres + Redis + Meilisearch |

### 5.5 CI/CD

- GitHub Actions: lint + type-check + unit tests + build on every PR
- Drizzle migrations gated by review
- Vercel preview deploy on PR open
- Production deploy on merge to `main` (blue/green via Vercel)
- npm publish for CLI: gated on tag push, signed with provenance, 2FA required

### 5.6 Cost model (estimated, per month)

| Service | 25K MAU | 100K MAU |
|---|---|---|
| Vercel | $20 (Pro) | $80–150 |
| Neon | Free tier | $20–50 |
| Upstash Redis | Free tier | $10 |
| Cloudflare (R2 + CDN) | $5–15 | $30–80 |
| Meilisearch Cloud | $30 | $50 |
| Fly.io (worker) | $10–20 | $50 |
| Sentry | Free tier | $26 |
| PostHog | Free tier | $50 |
| Axiom | Free tier | $25 |
| Resend | Free tier | $20 |
| Domain + misc | $5 | $5 |
| **Total** | **~$70–95** | **~$370–540** |

Comfortably software-margins from day one (PRD goal).

---

## 6. Validation — Does this satisfy the PRD?

Mapping every PRD requirement to its architectural home.

### 6.1 Functional requirements

| PRD FR | Where in architecture |
|---|---|
| FR-DSC-1..8 (Discovery) | Next.js App Router catalog routes (SSR/ISR) + Meilisearch (AD-7) |
| FR-INW-1..3 (Web install) | Listing detail components + manifest URLs (AD-5) |
| FR-INC-1..12 (CLI install) | `apps/cli` + format-adapters (AD-2) + tool detection (AD-6) + telemetry (AD-9) |
| FR-PUB-1..8 (Publishing) | Web publish flow + `datasetai publish` + linter pipeline + AgentVersion immutability (AD-4) |
| FR-MIR-1..6 (Auto-mirror) | Worker + source-adapters (AD-3) + suppression list (AD-12) + manifest publish job |
| FR-DSH-1..5 (Creator dashboard) | Authenticated Next.js dashboard routes querying Postgres + PostHog |
| FR-TRS-1..5 (Trust & moderation) | Manual review queue (AD-13), reports table, license field on schema |

### 6.2 Non-functional requirements

| PRD NFR | Architectural answer |
|---|---|
| NFR-PRF (Performance) | Vercel SSR + Cloudflare CDN + Meilisearch + R2 immutable URLs |
| NFR-SCL (Scalability) | Modular monolith with clear extraction seams (AD-1) |
| NFR-REL (Reliability) | CDN-cached install path independent of web (AD-5); immutable versions (AD-4) |
| NFR-SEC (Security) | No hosted runtime; Auth.js OAuth; Zod validation; rate limits; signed npm publishes |
| NFR-PRV (Privacy) | Anonymous telemetry (AD-9); GDPR-aware schema (deleted_at + 30-day delete pipeline) |
| NFR-ACC (Accessibility) | shadcn/Radix base + Lighthouse CI gate |
| NFR-I18N | next-intl from day 1 (AD-11) |
| NFR-OBS | PostHog + Sentry + Axiom + status page |
| NFR-CMP (Compliance) | Stripe Tax for Phase 2; DMCA documented; suppression flow first-class |
| NFR-LGL (Legal) | ToS/Privacy/Creator Agreement live before launch |

### 6.3 PRD risks — architectural mitigations

| PRD Risk | Architectural mitigation |
|---|---|
| R-1 (Anthropic launches Skills marketplace) | Format-adapter plugin keeps cross-tool support cheap to extend (AD-2) |
| R-3 (Cursor launches its own registry) | Cross-tool by design; AGENTS.md + .cursorrules adapters in Phase 2 (AD-2) |
| R-5 (Auto-mirror legal/social backlash) | Source-adapter abstraction + suppression first-class + SLA (AD-3, AD-12) |
| R-6 (Cold-start) | Same as R-5 — fast onboarding for sources and direct-publish flow |
| R-7 (Malicious agent) | No hosted execution; Phase-3 scanning hooks pre-baked (AD-13); content-hash audit trail (AD-4) |
| R-8 (Format proliferation) | Plugin contract per format (AD-2) — adding a format = adding a file |
| R-10 (Search quality) | Meilisearch (AD-7) — typo-tolerant + faceted out of the box |
| R-11 (Solo team can't ship in 6 months) | Modular monolith + managed services (AD-1) — minimal ops |
| R-12 (CLI security incident) | npm provenance signing + 2FA + no shell-out for installs |

### 6.4 Architectural risks (newly identified during architecture work)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| AR-1 | Vendor lock-in to Vercel | Medium | Low | Code is plain Next.js — migration to SST/Cloudflare Pages/Fly is mechanical |
| AR-2 | Cloudflare R2 outage during launch | Low | High | R2 is S3-compatible — failover to S3 in <2 hours documented |
| AR-3 | Meilisearch Cloud single-vendor | Low | Medium | Self-host fallback documented; index is rebuildable from Postgres |
| AR-4 | BullMQ dashboard exposed to internet | Low | High | Bull Board behind admin auth + IP allowlist |
| AR-5 | npm package compromise | Low | Catastrophic | npm 2FA + provenance signing + minimum publish-permission scope |
| AR-6 | Manifest URL signing not enforced | Medium | Medium | **MVP — see story E1.4b in epics.md.** Manifests signed with platform Ed25519 key; CLI hard-fails on signature mismatch; 30-day key-rotation overlap. |
| AR-7 | Postgres → Meilisearch sync drift | Medium | Low | Periodic full reindex job (weekly) on top of incremental sync |
| AR-8 | CDN cache poisoning on listing edits | Low | Medium | Manifest version is part of URL (immutable); listing edit = new manifest URL via cache-bust query |
| AR-9 | "claim listing" GitHub-ownership-spoof | Low | High | Use GitHub OAuth `repo` scope verify + contributor membership; not just "user has repo named X" |
| AR-10 | Worker queue backlog during traffic spike | Medium | Low | BullMQ backpressure; non-critical jobs (analytics roll-ups) can lag |

---

## 7. Open Architectural Questions (decisions to make before/during build)

1. **Monorepo tool: pnpm workspaces vs. Turborepo vs. Nx.** Lean: pnpm + Turborepo (fastest CI, simplest mental model).
2. **UI component lib: shadcn/ui (copied) vs. a npm component lib.** Lean: shadcn — better ownership of A11Y + branding.
3. **Drizzle vs. Prisma.** Lean: Drizzle for SQL transparency.
4. **Meilisearch Cloud vs. self-hosted.** Lean: Cloud at MVP; self-host eval as cost grows.
5. **CLI distribution: `npx`-only vs. also Homebrew/Scoop/single-binary.** Lean: `npx`-only at MVP (matches BMAD pattern); revisit Phase 2.
6. **Telemetry endpoint: public CDN vs. dedicated edge worker.** Lean: dedicated Cloudflare Worker (rate-limit + abuse protection + sticky to CDN).
7. ~~**Should we sign manifests at MVP or Phase 1.5?**~~ **RESOLVED 2026-05-02:** sign at MVP, CLI hard-fails on mismatch from day one. See epics.md story E1.4b. AR-6 mitigation updated.
8. **Email: Resend vs. Postmark.** Lean: Resend (cheaper, React-email native).
9. **i18n message extraction tooling: manual vs. automated.** Lean: manual at MVP; investigate `i18n-ally` extension + `lingo.dev` for Phase 2.
10. **Status page: statuspage.io vs. Better Uptime vs. self-host.** Lean: Better Uptime (cheap, has on-call + alerting).

---

## 8. Implementation Roadmap (sequencing, no time estimates)

> Per the BMAD architecture-skill rule: no time estimates. The roadmap is sequencing, not Gantt.

### Phase 0 — Foundations (must precede everything)
- Monorepo + Turborepo + tooling
- Postgres schema + Drizzle + migration pipeline
- Auth.js + GitHub OAuth + email magic link
- Cloudflare R2 + CDN setup
- CI/CD (Vercel previews + Neon DB branches)
- ToS + Privacy Policy + Creator Agreement drafted
- Status page live
- Sentry + PostHog + Axiom wired

### Phase 1A — Read-only MVP
- Catalog browse (listings table seeded with hand-curated examples)
- Listing detail pages (SSR)
- Search via Meilisearch
- Public profile pages
- Filters + categories

### Phase 1B — CLI install
- CLI scaffolding + `install` + `search` commands
- `claude-skill` + `mcp-server` format adapters
- Tool auto-detection
- Manifest + content publish pipeline (R2 + CDN)
- Anonymous telemetry endpoint

### Phase 1C — Publishing
- GitHub OAuth creator signup
- Direct web upload publish flow
- Linter
- Listing claim flow
- AgentVersion immutability + content-hash storage

### Phase 1D — Auto-mirror
- Worker service (Fly.io) + BullMQ + Upstash Redis
- Source-adapters: VoltAgent, alirezarezvani/claude-skills, Smithery (metadata)
- Manifest publish job
- Suppression list + admin UI for suppressions

### Phase 1E — Trust + dashboard
- Verified-publisher application + admin queue
- Listing report flow
- Creator dashboard (install counts, by-tool breakdown, basic perf metrics)

### Phase 1F — Polish + launch prep
- Lighthouse a11y audit pass
- DMCA process documented + tested
- Status page + uptime monitoring
- Founding-creator onboarding flow

### Phase 2 (post-MVP)
- Format expansion (AGENTS.md, .cursorrules, Codex, Aider, Gemini CLI)
- Stripe Connect integration + paid agents + creator payouts
- Bundles
- Enhanced analytics
- Localization

### Phase 3
- Private/team registries + SSO (SAML/OIDC) + audit logs
- Automated security scanning (malicious-code detection, prompt injection)
- Sandboxed eval environment + trust scores
- Public API for programmatic install (CI/CD pipelines)
- Marketplace search SDK

---

## 9. Decisions Index

| ID | Decision | Section |
|---|---|---|
| AD-1 | Modular monolith | §3 |
| AD-2 | FormatAdapter plugin | §3 |
| AD-3 | SourceAdapter plugin | §3 |
| AD-4 | Content-addressable AgentVersion | §3 |
| AD-5 | CDN-cached install path | §3 |
| AD-6 | Filesystem-heuristic tool detection | §3 |
| AD-7 | Meilisearch with Postgres source-of-truth | §3 |
| AD-8 | Auth.js v5 + GitHub OAuth | §3 |
| AD-9 | Anonymous CLI telemetry, opt-out | §3 |
| AD-10 | Stripe Connect Express (Phase 2, designed-now) | §3 |
| AD-11 | i18n via next-intl from day 1 | §3 |
| AD-12 | Suppression list as first-class entity | §3 |
| AD-13 | Verified-publisher manual review queue | §3 |
| AD-14 | Vercel preview + Neon branch per PR | §3 |
| AD-15 | Result types in core, exceptions at boundaries | §3 |

---

## 10. Source Documents

- [Product Brief](./product-brief-datasetai-2026-05-02.md)
- [PRD](./prd.md)
- [Market Research](./research/market-llm-agent-marketplace-research-2026-05-02.md)
- [Supply Bootstrap Plan](./supply-bootstrap-plan-2026-05-02.md)

---

_End of Architecture Decision Document v0.1 (yolo draft). Next steps: review, iterate on Open Questions (§7), then proceed to `bmad-create-epics-and-stories` to shard the PRD into trackable backlog and `bmad-check-implementation-readiness` to gate-check before build._
