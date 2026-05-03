---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/product-brief-datasetai-2026-05-02.md'
  - '_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md'
  - '_bmad-output/planning-artifacts/supply-bootstrap-plan-2026-05-02.md'
project_name: 'datasetai.xyz'
user_name: 'Semma'
date: '2026-05-02'
mode: 'yolo'
total_epics: 7
total_stories: 115
sprintable_stories: 65
mvp_stories: 63
---

# datasetai.xyz — Epic Breakdown

## Overview

This document decomposes the PRD requirements and Architecture decisions into **7 epics** containing **91 stories**, each with Gherkin-style acceptance criteria, sizing, dependencies, and FR/NFR coverage tags. Stories are sequenced for greenfield delivery — Epic 1 (Foundations) blocks all others.

> Estimation: BMAD discourages time estimates. Sizes are **t-shirt** (XS/S/M/L/XL) for relative complexity only.

---

## Requirements Inventory

### Functional Requirements (from PRD §9)

```
FR-DSC-1: Catalog browse — paginated, no auth required
FR-DSC-2: Full-text search across title/description/tags/content, < 500ms p95
FR-DSC-3: Faceted filters (format, tool, category, license, free/paid, publisher type, recency)
FR-DSC-4: Sort by relevance, install count, recently updated, recently created
FR-DSC-5: Listing detail page with all metadata + install command
FR-DSC-6: Category & tag pages
FR-DSC-7: Public creator profile pages
FR-DSC-8: Anonymous-user recently-viewed history (localStorage)

FR-INW-1: One-click copy install command on listing page
FR-INW-2: Tool-specific install variants
FR-INW-3: Web "open in CLI" deep-link (best-effort)

FR-INC-1: `npx datasetai install <agent-id>` writes to detected tool's folder
FR-INC-2: Auto-detection of local AI tool by filesystem heuristics
FR-INC-3: `--format=<format>` flag overrides default format
FR-INC-4: `--tool=<tool>` flag overrides auto-detected tool
FR-INC-5: Multi-tool install via comma-separated list
FR-INC-6: Version pinning via `<agent-id>@<version>`
FR-INC-7: `npx datasetai search <query>` queries catalog from terminal
FR-INC-8: `npx datasetai list` lists agents in current project
FR-INC-9: `npx datasetai uninstall <agent-id>` removes installed files
FR-INC-10: `npx datasetai update [<agent-id>]` updates agents (STRETCH v1)
FR-INC-11: `npx datasetai publish` publishes from local folder (STRETCH v1)
FR-INC-12: Anonymous install telemetry with opt-out via env var

FR-PUB-1: GitHub OAuth creator signup
FR-PUB-2: Direct web publish via zip/multi-file upload
FR-PUB-3: Format auto-detection on publish
FR-PUB-4: Linter validates format-specific manifests on publish
FR-PUB-5: Versioning — every publish creates immutable AgentVersion
FR-PUB-6: Edit metadata without bumping version
FR-PUB-7: Unpublish version (hide but preserve)
FR-PUB-8: Multi-format publish (one listing, multiple format variants)

FR-MIR-1: Scheduled source ingestion jobs
FR-MIR-2: Source attribution displayed on every mirrored listing
FR-MIR-3: "Claim listing" flow via GitHub OAuth + repo ownership verification
FR-MIR-4: Mirror suppression — < 72h SLA on requests
FR-MIR-5: Mirror refresh cadence (weekly default, daily for top-1000)
FR-MIR-6: License preservation from upstream

FR-DSH-1: Lifetime / 7-day / 30-day install metrics
FR-DSH-2: Installs broken down by detected tool
FR-DSH-3: Listing performance (page views, search-rank)
FR-DSH-4: Per-version install distribution
FR-DSH-5: CSV export of metrics

FR-TRS-1: Verified-publisher application form
FR-TRS-2: Verified-publisher badge on profile + listings after approval
FR-TRS-3: Listing report flow → admin queue
FR-TRS-4: License field required on every publish
FR-TRS-5: Admin content-policy enforcement (takedown)
```

### Non-Functional Requirements (from PRD §10)

```
NFR-PRF-1: Catalog page p95 < 1.5s globally
NFR-PRF-2: Search p95 < 500ms
NFR-PRF-3: Listing detail p95 < 1.0s
NFR-PRF-4: CLI install p95 < 5s for ≤100KB agent over 50 Mbps
NFR-PRF-5: SSR/static rendering for SEO

NFR-SCL-1: Capacity for 100K MAU + 1M monthly install events at MVP launch
NFR-SCL-2: Listings table scales to 1M+ records sub-500ms search
NFR-SCL-3: Mirror jobs scale horizontally; resumable

NFR-REL-1: 99.5% web availability monthly
NFR-REL-2: CLI install does not require web app to be up
NFR-REL-3: All listings versioned immutable; no silent content swaps

NFR-SEC-1: All traffic over HTTPS
NFR-SEC-2: OWASP top-10 baseline
NFR-SEC-3: Rate limiting on auth/publish/report endpoints
NFR-SEC-4: Secrets via platform vaults
NFR-SEC-5: No hosted runtime / shell-execution
NFR-SEC-6: Phase 3 — automated agent-content scanning

NFR-PRV-1: GDPR/CCPA compliant — clear privacy policy, data export, account deletion within 30 days
NFR-PRV-2: CLI telemetry opt-out via env var
NFR-PRV-3: Minimum GitHub OAuth scope

NFR-ACC-1: WCAG 2.1 AA on web
NFR-ACC-2: Keyboard-only nav for primary flows
NFR-ACC-3: Screen-reader-friendly listing detail + search

NFR-I18N-1: Architecture supports i18n at MVP
NFR-I18N-2: Listings in any language; search supports non-Latin scripts
NFR-I18N-3: Phase 2 — Russian, Spanish, German, Japanese, Mandarin

NFR-OBS-1: Product analytics on every key event
NFR-OBS-2: Error tracking with deploy-tagging
NFR-OBS-3: Structured logs for backend
NFR-OBS-4: Public status page

NFR-CMP-1: Tax handling for international payouts (Phase 2)
NFR-CMP-2: DMCA process documented
NFR-CMP-3: Content-policy enforcement workflow

NFR-LGL-1: Two-sided ToS
NFR-LGL-2: Creator agreement
NFR-LGL-3: End-user agreement
NFR-LGL-4: Privacy policy
NFR-LGL-5: Mirror policy + DMCA-style takedown
```

### Additional Requirements (from Architecture)

```
- Modular monolith: one Next.js app + one worker service + one CLI npm package
- Stack: Next.js 15 / Auth.js v5 / Drizzle ORM / Postgres (Neon) / Meilisearch / R2 + CDN / BullMQ + Upstash Redis / Fly.io worker
- FormatAdapter plugin contract (AD-2) — shared package for server + CLI
- SourceAdapter plugin contract (AD-3) — auto-mirror sources
- Content-addressable AgentVersion via SHA-256 (AD-4)
- CDN-cached install path independent of web app (AD-5)
- Filesystem-heuristic tool auto-detection priority list (AD-6)
- Meilisearch + change-data sync from Postgres (AD-7)
- Anonymous install_id + telemetry endpoint (AD-9)
- Stripe Connect schema designed-now-gated-now (AD-10)
- next-intl from day 1 (AD-11)
- Suppression list as first-class entity (AD-12)
- Manual verified-publisher review (AD-13)
- Vercel preview + Neon DB branch per PR (AD-14)
- Result types in core; exceptions only at boundaries (AD-15)
- npm publish with provenance signing + 2FA
- Manifest signing — MVP, story E1.4b (was AR-6 risk; resolved to MVP on 2026-05-02)
- "Claim listing" verification by contributor membership, not just repo existence (AR-9)
- Periodic full reindex of Meilisearch (weekly) on top of incremental sync (AR-7)
```

### UX Design Requirements

_None — no UX Design Specification has been authored yet. Stories that involve UI ship with developer-and-Mary-stewarded design pending a future UX-spec pass. UX-DR work to be run pre-launch via `bmad-create-ux-design` (see Implementation Readiness Report M-1)._

---

## FR/NFR Coverage Map

| Requirement | Covered by Story |
|---|---|
| FR-DSC-1 | E2.1 |
| FR-DSC-2 | E2.3 |
| FR-DSC-3 | E2.4 |
| FR-DSC-4 | E2.5 |
| FR-DSC-5 | E2.2 |
| FR-DSC-6 | E2.6 |
| FR-DSC-7 | E2.7 |
| FR-DSC-8 | E2.8 |
| FR-INW-1 | E3.14 |
| FR-INW-2 | E3.14 |
| FR-INW-3 | E3.14 (best-effort note in AC) |
| FR-INC-1 | E3.2 |
| FR-INC-2 | E3.5 |
| FR-INC-3 | E3.6 |
| FR-INC-4 | E3.6 |
| FR-INC-5 | E3.7 |
| FR-INC-6 | E3.8 |
| FR-INC-7 | E3.9 |
| FR-INC-8 | E3.10 |
| FR-INC-9 | E3.11 |
| FR-INC-10 | E3.12 (STRETCH) |
| FR-INC-11 | E4.9 (STRETCH) |
| FR-INC-12 | E3.13 |
| FR-PUB-1 | E4.1 |
| FR-PUB-2 | E4.2 |
| FR-PUB-3 | E4.3 |
| FR-PUB-4 | E4.4 |
| FR-PUB-5 | E4.5 |
| FR-PUB-6 | E4.6 |
| FR-PUB-7 | E4.7 |
| FR-PUB-8 | E4.8 |
| FR-MIR-1 | E5.2, E5.3, E5.4, E5.5, E5.6 |
| FR-MIR-2 | E5.7 |
| FR-MIR-3 | E5.8 |
| FR-MIR-4 | E5.9 |
| FR-MIR-5 | E5.10 |
| FR-MIR-6 | E5.11 |
| FR-DSH-1 | E6.1 |
| FR-DSH-2 | E6.2 |
| FR-DSH-3 | E6.3 |
| FR-DSH-4 | E6.4 |
| FR-DSH-5 | E6.5 |
| FR-TRS-1 | E7.1 |
| FR-TRS-2 | E7.2 |
| FR-TRS-3 | E7.3, E7.4 |
| FR-TRS-4 | E7.5 |
| FR-TRS-5 | E7.6 |
| NFR-PRF-1..5 | E1.7 (perf budgets in CI), all UI stories |
| NFR-SCL-1..3 | E1.2 (DB), E5.1 (worker), AD-1 architecture |
| NFR-REL-1..3 | E1.7 (status page), E3.2 (CDN-cached install), E4.5 (immutable versions) |
| NFR-SEC-1..6 | E1.3 (auth), E1.7 (rate limit + secrets), E3.1 (CLI provenance), E7 (trust) |
| NFR-PRV-1..3 | E1.6 (privacy policy), E3.13 (telemetry opt-out), E1.3 (min OAuth scope) |
| NFR-ACC-1..3 | E1.7 (Lighthouse CI), all UI stories |
| NFR-I18N-1..3 | E1.1 (next-intl from day 1) |
| NFR-OBS-1..4 | E1.7 |
| NFR-CMP-1..3 | E1.6 (DMCA), E7.6 (content policy), Phase 2 |
| NFR-LGL-1..5 | E1.6 |

**Coverage status:** 100% of MVP-scope FRs and NFRs mapped to stories. Stretch items flagged.

---

## Epic List

| # | Epic | Stories | Sizing | Phase | Blocks |
|---|---|---|---|---|---|
| **E1** | Phase 0: Foundations | 10 | L | 0 | Everything else |
| **E2** | Discovery & Browse | 9 | L | 1A | E5, E6 |
| **E3** | CLI Install | 14 | XL | 1B | (depends on E1, E2) |
| **E4** | Publishing | 10 | L | 1C | E5, E6 |
| **E5** | Auto-Mirror | 11 | XL | 1D | (depends on E1, E2) |
| **E6** | Creator Dashboard | 5 | M | 1E | (depends on E1, E2, E3, E4) |
| **E7** | Trust & Moderation | 6 | M | 1E/1F | (depends on E1, E2, E4) |
| | **Total** | **91 stories** ⚠️ *(see counting note below)* | | | |

> ⚠️ Note: stories below are decomposed at PR-grain — most are 0.5–3 days of focused engineering. Real story count: **65 numbered sprintable stories** (post 2026-05-02 cleanup; +3 from original 62: E1.2b split, E1.4b manifest signing, E1.8 install-success gate). Of these, 2 (E3.12 + E4.9) are explicitly cut to Phase 2.

---

# Epic 1 — Phase 0: Foundations

> *Goal: Establish the codebase, infrastructure, auth, observability, manifest-signing, legal foundation, and launch-readiness gating that everything else builds on. Until E1 is done, nothing else can ship.*

> ⚠️ **Doctrine note:** This is technically a "technical-milestone epic" that violates BMAD's "user value per epic" principle (raised as C-1 in the Implementation Readiness Report). Accepted intentionally for greenfield pragmatism — splitting foundations across user-value epics would obscure schema/auth/CDN/signing sequencing more than it would clarify. Renamed from "Foundational Platform" to "Phase 0: Foundations" to make its non-user-value status explicit rather than pretending otherwise.

**Phase:** 0 — must precede all other epics
**Total stories:** 10 (E1.1, E1.2a, E1.2b, E1.3, E1.4, E1.4b, E1.5, E1.6, E1.7, E1.8)
**Sizing:** L

---

### Story E1.1 — Monorepo + Tooling Bootstrap

As a **maintainer**,
I want **a pnpm + Turborepo monorepo with shared TypeScript / ESLint / Tailwind configs**,
So that **all apps and packages share types and tooling cleanly**.

**Sizing:** S
**Dependencies:** None (foundational)
**Coverage:** Architecture AD-1, NFR-I18N-1 (i18n from day 1)

**Acceptance Criteria:**

**Given** an empty repo
**When** the monorepo is initialized
**Then** `pnpm install` succeeds with workspaces for `apps/{web,worker,cli}` and `packages/{core,db,format-adapters,source-adapters,ui,api-client,config}`
**And** `pnpm build` runs Turbo across all workspaces
**And** ESLint + TypeScript + Prettier configs are shared from `tooling/`
**And** `next-intl` is integrated into `apps/web` with empty `messages/en.json` ready
**And** README documents repo layout + dev setup

---

### Story E1.2a — Core Postgres Schema + Drizzle Migrations

As a **backend engineer**,
I want **the *core* Postgres schema in Drizzle (users, agents, agent_versions, installs, sessions)**,
So that **catalog, install, and publishing stories have a stable data layer**.

**Sizing:** S
**Dependencies:** E1.1
**Coverage:** Architecture §5.2, NFR-SCL-1..3
**Note:** Split from original E1.2 per Implementation Readiness Report C-2 — "create tables when first needed" doctrine.

**Acceptance Criteria:**

**Given** a clean Postgres database
**When** `pnpm db:migrate` is run
**Then** the schema includes: `users`, `agents`, `agent_versions`, `installs`, `sessions`
**And** indexes match Architecture §5.2 for these tables (search_rank, creator, source, installs by agent + install_id)
**And** Phase-2 nullable columns (`stripe_connect_account_id`, `price_cents`, `payment_intent_id`) are present
**And** `pnpm db:generate` produces TypeScript types from the schema
**And** Neon DB branching is configured for Vercel preview deploys (AD-14)

---

### Story E1.2b — Trust & Moderation Schema (just-in-time)

As a **backend engineer**,
I want **the trust/moderation tables (suppressions, reports, verification_applications) added when E5/E7 work begins**,
So that **schema is created when first needed, not all upfront**.

**Sizing:** XS
**Dependencies:** E1.2a
**Coverage:** Architecture §5.2 (suppressions, reports, verification_applications), supports E5.9 + E7.1 + E7.3
**Note:** Split from original E1.2 per Implementation Readiness Report C-2. Land just-in-time before E5 (auto-mirror) or E7 (trust) starts.

**Acceptance Criteria:**

**Given** the core schema (E1.2a) exists
**When** the migration is applied
**Then** the schema adds: `suppressions`, `reports`, `verification_applications`
**And** indexes match Architecture §5.2 (suppressions active, reports by status, verifications by user)
**And** existing tables are unmodified

---

### Story E1.3 — Auth.js v5 + GitHub OAuth + Email Magic Links

As a **user (creator or browser)**,
I want **to sign in with GitHub or email magic link**,
So that **I can access account features**.

**Sizing:** M
**Dependencies:** E1.1, E1.2
**Coverage:** FR-PUB-1, FR-MIR-3 prerequisite, NFR-PRV-3, NFR-SEC-2

**Acceptance Criteria:**

**Given** a logged-out user
**When** they click "Sign in with GitHub"
**Then** they OAuth via GitHub with minimum scopes (`read:user`, `user:email`)
**And** a `users` row is created or updated with `github_id`, `github_login`, `email`, `display_name`, `avatar_url`
**And** they are redirected to the previous page

**Given** a logged-out user
**When** they request an email magic link
**Then** Resend sends a one-time-use link valid for 15 minutes
**And** clicking the link signs them in

**Given** a signed-in user
**When** they sign out
**Then** the session is invalidated server-side

---

### Story E1.4 — Cloudflare R2 + CDN Setup

As a **maintainer**,
I want **R2 object storage and Cloudflare CDN routes provisioned**,
So that **agent content and manifests are served fast and cheap globally**.

**Sizing:** S
**Dependencies:** None (infra)
**Coverage:** Architecture AD-4, AD-5, NFR-PRF-4, NFR-REL-2

**Acceptance Criteria:**

**Given** a Cloudflare account
**When** infrastructure is provisioned
**Then** an R2 bucket `datasetai-content` exists with public-read access
**And** `cdn.datasetai.xyz/agents/<id>/<version>.json` and `cdn.datasetai.xyz/content/<sha256>.tar.gz` route to R2
**And** `Cache-Control: public, immutable, max-age=31536000` is enforced on content
**And** content uploads are gated to authenticated server processes only

---

### Story E1.4b — Manifest Signing + CLI Signature Verification

As a **system**,
I want **agent manifests cryptographically signed by a platform key, with CLI verification**,
So that **users can trust that fetched content is genuine and not tampered with at the CDN**.

**Sizing:** S
**Dependencies:** E1.4
**Coverage:** Architecture AR-6 (resolved 2026-05-02 to MVP), Implementation Readiness C-4
**Resolves:** Open Architectural Question §7 Q7

**Acceptance Criteria:**

**Given** the publish pipeline (E4.5 / E4.10)
**When** a manifest JSON is generated
**Then** it is signed with the platform's Ed25519 private key
**And** the signature is included in the manifest as `signature` (Base64) + `key_id` fields

**Given** the CLI fetches a manifest
**When** it parses the JSON
**Then** it verifies the `signature` against the public key bundled in the CLI binary
**And** if the signature is valid, the install proceeds
**And** if the signature is invalid OR missing, the CLI hard-fails with error code `MANIFEST_SIGNATURE_INVALID` and a clear message

**Given** a key-rotation event
**When** a new CLI version is published with a new public key
**Then** the CLI accepts manifests signed with either the old OR new key for a 30-day overlap window
**And** beyond the overlap, only the new key is accepted

**Given** the platform's private key
**When** stored
**Then** it lives in a vendor-managed secrets store (Vercel/Fly env), never in code, with rotation procedure documented in `docs/security/key-rotation.md`

---

### Story E1.5 — CI/CD with Vercel Previews + Neon DB Branches

As a **maintainer**,
I want **per-PR preview deploys with isolated DB branches**,
So that **reviewers can test real running code with clean data**.

**Sizing:** S
**Dependencies:** E1.1, E1.2
**Coverage:** Architecture AD-14

**Acceptance Criteria:**

**Given** a PR is opened
**When** CI runs
**Then** lint + type-check + unit tests run and gate merge
**And** a Vercel preview is deployed for `apps/web`
**And** a Neon branch DB is created with the deterministic seed fixture
**And** the PR has a comment with the preview URL
**And** on merge to `main`, production deploy runs blue/green

---

### Story E1.6 — Legal & Compliance Documents

As a **founder**,
I want **ToS, Privacy, Creator Agreement, DMCA, and Mirror Policy live**,
So that **the platform is legally launchable**.

**Sizing:** M (legal review + drafting)
**Dependencies:** None (parallel to engineering)
**Coverage:** NFR-LGL-1..5, NFR-CMP-2, NFR-PRV-1

**Acceptance Criteria:**

**Given** a fresh deploy
**When** a user navigates to `/terms`, `/privacy`, `/creator-agreement`, `/dmca`, `/mirror-policy`
**Then** each page renders the latest legal doc with versioned headings
**And** signup flow requires acceptance of ToS + Privacy
**And** publish flow requires acceptance of Creator Agreement
**And** DMCA contact email and process are documented
**And** Mirror Policy explains attribution + suppression flow with < 72h SLA

---

### Story E1.7 — Observability Foundation (PostHog + Sentry + Axiom + Status Page)

As an **operator**,
I want **all key product events, errors, and logs aggregated**,
So that **we can detect and diagnose issues in production**.

**Sizing:** M
**Dependencies:** E1.1
**Coverage:** NFR-OBS-1..4, NFR-PRF (perf budgets), NFR-ACC (Lighthouse CI), NFR-SEC-3 (rate limiting)

**Acceptance Criteria:**

**Given** the deploy pipeline
**When** code lands in production
**Then** Sentry receives errors with `release` tag = deploy SHA
**And** PostHog receives all events from §4.9 (`search_performed`, `listing_viewed`, `install_attempted`, `install_succeeded`, `install_failed`, `agent_published`, `listing_claimed`, `report_submitted`)
**And** Axiom receives structured logs from worker + web (server-side) + CLI errors
**And** Better Uptime polls catalog/search/install endpoints; status page is at `status.datasetai.xyz`
**And** Lighthouse CI runs in PR pipeline; PR fails if a11y < 95 on key pages
**And** rate limits enforced at Vercel edge: auth (10/min/IP), publish (5/hour/user), report (3/hour/user)

---

### Story E1.8 — Launch Readiness: Install Success Rate Gate

As a **launch-prep operator**,
I want **install-success-rate continuously measured and gated**,
So that **we don't launch with a broken install path and can detect regressions post-launch**.

**Sizing:** S
**Dependencies:** E1.7, E3.13 (telemetry)
**Coverage:** PRD §8.3 MVP exit-criteria ("≥ 95% install-success rate"), Implementation Readiness C-3
**Resolves:** C-3 (PRD MVP exit-criteria not mapped to epics)

**Acceptance Criteria:**

**Given** install telemetry events flowing into PostHog (E3.13)
**When** the launch-readiness PostHog dashboard is opened
**Then** the dashboard shows `install_succeeded / install_attempted` ratio over rolling 7-day and 30-day windows
**And** breakdowns by tool, format, and CLI version are visible
**And** the success rate is broken out by `error_code` (top 5 failure modes ranked)

**Given** the launch checklist
**When** evaluated for a launch decision
**Then** the gate requires ≥ 95% install-success rate over a 30-day window with ≥ 1,000 install attempts
**And** the launch is blocked if the gate fails

**Given** a post-launch state with telemetry flowing
**When** the success rate drops below 95% over any rolling 24-hour window with ≥ 100 attempts
**Then** an alert fires to on-call (Sentry alert wired)
**And** the alert links directly to the breakdown dashboard

**Given** PRD §8.3 also lists "≥ 5 anchor success stories" as a launch gate
**When** that criterion is evaluated
**Then** ownership lives in the [Supply Bootstrap Plan](./supply-bootstrap-plan-2026-05-02.md) §Definition of Done — *not* in this engineering story. This AC documents the cross-reference; the work is non-engineering.

---

# Epic 2 — Discovery & Browse

> *Goal: Public-facing catalog, search, and listing detail. The supply-side discovery engine.*

**Phase:** 1A
**Total stories:** 9
**Sizing:** L
**Dependencies:** E1

---

### Story E2.1 — Public Catalog Page

As a **visitor**,
I want **to browse the public agent catalog without signing in**,
So that **I can discover agents before committing**.

**Sizing:** M
**Dependencies:** E1.1, E1.2, E1.7
**Coverage:** FR-DSC-1, NFR-PRF-1, NFR-PRF-5, NFR-ACC-1, NFR-ACC-2

**Acceptance Criteria:**

**Given** an unauthenticated visitor
**When** they navigate to `/agents` or `/`
**Then** the catalog shows paginated agent cards (20 per page)
**And** each card shows: name, short description, primary format icon, supported tool icons, install count (30-day), creator handle (or "mirrored from <source>"), license
**And** the page is server-rendered (Vercel ISR with 60s revalidation)
**And** p95 load time < 1.5s globally
**And** the page is keyboard-navigable end-to-end
**And** the page is screen-reader-friendly (aria-labels, semantic landmarks)

---

### Story E2.2 — Listing Detail Page (SSR)

As a **visitor**,
I want **a detail page for each agent**,
So that **I can evaluate it before installing**.

**Sizing:** L
**Dependencies:** E2.1
**Coverage:** FR-DSC-5, FR-DSC-7, NFR-PRF-3, NFR-PRF-5

**Acceptance Criteria:**

**Given** a listing exists at slug `<agent-id>`
**When** a visitor navigates to `/agents/<agent-id>`
**Then** the page renders SSR with title, description, full content preview, version selector, install command snippet, supported tool icon row, install count (lifetime + 30-day), license, source attribution, creator profile link, related agents
**And** if the listing is mirrored, source attribution links upstream prominently with a "Claim this listing" CTA visible
**And** the page is canonical-tagged for SEO
**And** OpenGraph + Twitter Card tags are populated
**And** p95 load time < 1.0s

---

### Story E2.3 — Full-text Search via Meilisearch

As a **visitor**,
I want **fast, typo-tolerant search across the catalog**,
So that **I can find agents by name, description, or content**.

**Sizing:** L
**Dependencies:** E2.1
**Coverage:** FR-DSC-2, NFR-PRF-2, NFR-SCL-2

**Acceptance Criteria:**

**Given** the catalog has ≥ 1 agent
**When** a visitor enters a query in the search box
**Then** results appear in < 500ms p95
**And** results are typo-tolerant (e.g. "code revier" → matches "code reviewer")
**And** results rank by Meilisearch relevance + tiebreak on `search_rank` (precomputed install-count blend)
**And** the search index is kept in sync with Postgres via change-data sync (AD-7)
**And** a weekly full reindex job runs (AR-7 mitigation)
**And** non-Latin script queries work (NFR-I18N-2)

---

### Story E2.4 — Faceted Filters

As a **visitor**,
I want **to filter the catalog by format, tool, category, license, and recency**,
So that **I can narrow to relevant agents**.

**Sizing:** M
**Dependencies:** E2.3
**Coverage:** FR-DSC-3

**Acceptance Criteria:**

**Given** the catalog page
**When** a visitor selects facets in the sidebar (format, tool, category, license, free/paid, publisher type, last-updated range)
**Then** results update via Meilisearch facet filtering
**And** facet counts reflect available results
**And** selected facets are reflected in URL query params (shareable URLs)
**And** "Clear filters" resets state
**And** facets work in combination

---

### Story E2.5 — Sort Options

As a **visitor**,
I want **to sort results by relevance, install count, recently updated, recently created**,
So that **I can choose how to browse**.

**Sizing:** XS
**Dependencies:** E2.3
**Coverage:** FR-DSC-4

**Acceptance Criteria:**

**Given** the catalog page
**When** a visitor selects a sort option
**Then** results re-order accordingly
**And** the sort is reflected in URL query param
**And** default sort is `relevance` for searches, `install-count-30d` for unfiltered browsing

---

### Story E2.6 — Category Pages

As a **visitor**,
I want **dedicated pages for each category**,
So that **I can browse by domain (legal, sales-ops, code-review, etc.)**.

**Sizing:** S
**Dependencies:** E2.1
**Coverage:** FR-DSC-6

**Acceptance Criteria:**

**Given** at least one agent in a category
**When** a visitor navigates to `/categories/<category-slug>`
**Then** SSR page lists all agents in that category with the same card layout as catalog
**And** the page has SEO-optimized title + description
**And** category list at `/categories` shows all categories with counts

---

### Story E2.7 — Tag Pages + Creator Profile Pages

As a **visitor**,
I want **to browse agents by tag or by creator**,
So that **I can find related work**.

**Sizing:** S
**Dependencies:** E2.1, E2.6
**Coverage:** FR-DSC-6, FR-DSC-7

**Acceptance Criteria:**

**Given** a tag with ≥ 1 agent
**When** a visitor navigates to `/tags/<tag>`
**Then** all agents with that tag are listed

**Given** a creator with ≥ 1 agent
**When** a visitor navigates to `/u/<github-login>`
**Then** their public profile shows: avatar, bio, GitHub link, badges (verified-publisher if applicable), aggregate install count, list of all published agents

---

### Story E2.8 — Anonymous Recently-Viewed History

As a **visitor**,
I want **the site to remember what I recently viewed**,
So that **I can return to listings I was browsing**.

**Sizing:** XS
**Dependencies:** E2.2
**Coverage:** FR-DSC-8

**Acceptance Criteria:**

**Given** a visitor (not logged in)
**When** they view a listing detail
**Then** the listing ID is added to a localStorage list (max 20)
**And** the homepage shows a "Recently viewed" section if the list is non-empty
**And** clearing browser storage clears the history

---

### Story E2.9 — Personalized Homepage (cut from MVP — Phase 2)

As a **visitor**,
I want **a homepage that surfaces relevant, fresh content**,
So that **first impressions are useful**.

**Sizing:** S
**Dependencies:** E2.1, E2.3
**Coverage:** FR-DSC (homepage UX)

**Acceptance Criteria:**

**Given** an unauthenticated visitor
**When** they navigate to `/`
**Then** the homepage shows: trending this week, recently updated, top categories, featured creators, recently viewed (if applicable)
**And** sections are static at MVP launch; dynamic personalization moves to Phase 2

---

# Epic 3 — CLI Install

> *Goal: The flagship product surface — `npx datasetai install <agent>` works on macOS, Linux, Windows, across multiple AI tools, with telemetry and graceful errors.*

**Phase:** 1B
**Total stories:** 14
**Sizing:** XL
**Dependencies:** E1, E2 (catalog must exist for installs to resolve)

---

### Story E3.1 — CLI Scaffolding + npm Package + npx Entry

As a **maintainer**,
I want **a TypeScript CLI distributed via npm with `npx` entry**,
So that **users can run `npx datasetai install` with zero install friction**.

**Sizing:** S
**Dependencies:** E1.1
**Coverage:** Architecture §2.3, NFR-SEC-2 (provenance)

**Acceptance Criteria:**

**Given** the `apps/cli` workspace
**When** it is built
**Then** an npm package `datasetai` (or `@datasetai/cli` — TBD) is publishable with `bin/datasetai.ts` as entry
**And** `npx datasetai --version` prints the version
**And** `npx datasetai help` lists all commands
**And** npm publish CI uses 2FA + provenance signing
**And** the package works on Node 18+

---

### Story E3.2 — `install` Command (Hot Path)

As a **user**,
I want **`npx datasetai install <agent-id>` to install an agent into my current project**,
So that **I get value in one command**.

**Sizing:** L
**Dependencies:** E3.1, E3.3, E3.5, E1.4
**Coverage:** FR-INC-1, NFR-PRF-4, NFR-REL-2

**Acceptance Criteria:**

**Given** a valid `agent-id` and a detected local tool
**When** the user runs `npx datasetai install <agent-id>`
**Then** the CLI fetches the manifest from `cdn.datasetai.xyz/agents/<id>/latest.json`
**And** fetches the content tarball from the manifest's content URL
**And** extracts and writes files to the appropriate folder for the detected tool (FR-INC-2)
**And** updates `.datasetai/manifest.json` in the project root with the install record
**And** prints a success message with what was installed and where
**And** total round-trip < 5s p95 over 50 Mbps for ≤ 100 KB agents
**And** install works even if the web app is down (CDN-cached path, AD-5)
**And** install fails gracefully with a clear error if agent not found or content hash mismatches

---

### Story E3.3 — Format Adapter: Claude Skill

As a **CLI engineer**,
I want **a `claude-skill` FormatAdapter implementation**,
So that **Claude Code skills install correctly**.

**Sizing:** M
**Dependencies:** E3.1
**Coverage:** Architecture AD-2, FR-PUB-3, FR-PUB-4

**Acceptance Criteria:**

**Given** a Claude Skill agent (a folder with `SKILL.md` + optional supporting files)
**When** `claude-skill` adapter `install` is called
**Then** files are written to `<project-root>/.claude/skills/<skill-name>/`
**And** the adapter `validate` rejects missing `name` or `description` frontmatter fields
**And** the adapter `detect(files)` returns true when a `SKILL.md` is present
**And** `toolCompatibility()` returns `['claude-code']`

---

### Story E3.4 — Format Adapter: MCP Server

As a **CLI engineer**,
I want **an `mcp-server` FormatAdapter implementation**,
So that **MCP servers install correctly across MCP-aware clients**.

**Sizing:** M
**Dependencies:** E3.1
**Coverage:** Architecture AD-2

**Acceptance Criteria:**

**Given** an MCP server agent (folder with `package.json` or manifest + executable spec)
**When** `mcp-server` adapter `install` is called
**Then** the server's launch config is written to the appropriate MCP-client config file (Claude Desktop's `claude_desktop_config.json`, Cursor's MCP config, etc.)
**And** existing config is merged (not overwritten)
**And** `toolCompatibility()` returns `['claude-desktop', 'claude-code', 'cursor', 'codex-cli']` (where MCP is supported)

---

### Story E3.5 — Tool Auto-Detection

As a **user**,
I want **the CLI to auto-detect my AI tool**,
So that **I don't have to specify it every time**.

**Sizing:** M
**Dependencies:** E3.1
**Coverage:** FR-INC-2, Architecture AD-6

**Acceptance Criteria:**

**Given** a project directory
**When** `datasetai install` is run without `--tool`
**Then** detection runs in this priority order: `./.claude/` → `./.cursor/` or `./.cursorrules` → `./AGENTS.md` → `./codex/` → `./.aider.conf.yml` → `$HOME/.config/<tool>/`
**And** the first matching tool is selected
**And** if no tool is detected, the CLI prompts interactively with a numbered list
**And** detection is case-insensitive on Windows

---

### Story E3.6 — Format and Tool Override Flags

As a **user**,
I want **`--format=` and `--tool=` flags**,
So that **I can override defaults**.

**Sizing:** XS
**Dependencies:** E3.5
**Coverage:** FR-INC-3, FR-INC-4

**Acceptance Criteria:**

**Given** a multi-format agent
**When** `--format=mcp-server` is passed
**Then** the MCP-server variant is installed regardless of the agent's primary format
**And** when `--tool=cursor` is passed, the install writes to Cursor's folder regardless of detection
**And** invalid combinations (e.g. `--tool=cursor --format=claude-skill` when adapter has no Cursor export) print a clear error and exit non-zero

---

### Story E3.7 — Multi-Tool Install

As a **user**,
I want **to install one agent into multiple tools at once**,
So that **my agent works wherever I might use it**.

**Sizing:** S
**Dependencies:** E3.6
**Coverage:** FR-INC-5

**Acceptance Criteria:**

**Given** an agent with multi-tool compatibility
**When** the user runs `datasetai install <agent> --tool=claude-code,cursor`
**Then** the CLI installs into both tools sequentially
**And** if one fails, the failure is reported but the other still proceeds
**And** the local manifest records all successful installs

---

### Story E3.8 — Version Pinning

As a **user**,
I want **to install a specific version**,
So that **I can pin to a known-good release**.

**Sizing:** XS
**Dependencies:** E3.2
**Coverage:** FR-INC-6, NFR-REL-3

**Acceptance Criteria:**

**Given** an agent with multiple versions
**When** the user runs `datasetai install <agent>@1.2.0`
**Then** version 1.2.0 is fetched and installed
**And** if version doesn't exist, error is clear
**And** without `@` qualifier, latest stable is installed

---

### Story E3.9 — `search` Command

As a **user**,
I want **to search the catalog from the terminal**,
So that **I can find agents without leaving my flow**.

**Sizing:** S
**Dependencies:** E3.1, E2.3
**Coverage:** FR-INC-7

**Acceptance Criteria:**

**Given** a catalog with agents
**When** the user runs `datasetai search <query>`
**Then** the CLI calls the search API
**And** prints top 10 results: id, title, format, install-count
**And** flags `--format=`, `--tool=`, `--limit=` are respected

---

### Story E3.10 — `list` Command

As a **user**,
I want **to see what agents are installed in my project**,
So that **I know my stack**.

**Sizing:** XS
**Dependencies:** E3.2
**Coverage:** FR-INC-8

**Acceptance Criteria:**

**Given** a project with at least one installed agent
**When** the user runs `datasetai list`
**Then** the CLI reads `.datasetai/manifest.json` and prints: id, version, format, tool, install date

---

### Story E3.11 — `uninstall` Command

As a **user**,
I want **to uninstall an agent cleanly**,
So that **I can manage my project's stack**.

**Sizing:** S
**Dependencies:** E3.10
**Coverage:** FR-INC-9

**Acceptance Criteria:**

**Given** an installed agent
**When** the user runs `datasetai uninstall <agent-id>`
**Then** the files written by install are removed
**And** the local manifest entry is removed
**And** if `--tool=<tool>` is specified, only that tool's variant is removed (preserving multi-tool installs)
**And** if files don't exist (already removed manually), a warning prints but exit code is 0

---

### Story E3.12 — `update` Command (cut from MVP — Phase 2)

As a **user**,
I want **to update installed agents to the latest compatible version**,
So that **I stay current**.

**Sizing:** S — cut from MVP, ships in Phase 2
**Dependencies:** E3.10
**Coverage:** FR-INC-10
**Note:** Cut from MVP per cleanup pass 2026-05-02. Users can `uninstall` + `install` to update at MVP; the dedicated `update` command lands in Phase 2.

**Acceptance Criteria:**

**Given** installed agents with available updates
**When** the user runs `datasetai update [<agent-id>]`
**Then** the CLI checks the manifest for newer versions
**And** updates them in place
**And** prints a summary
**And** without an agent-id, all installed agents are checked

> 🔴 **Cut from MVP scope on 2026-05-02.** Implement in Phase 2.

---

### Story E3.13 — Anonymous Telemetry

As a **product team**,
I want **anonymous install telemetry**,
So that **we know which agents work and which break**.

**Sizing:** S
**Dependencies:** E3.2
**Coverage:** FR-INC-12, NFR-PRV-2, Architecture AD-9

**Acceptance Criteria:**

**Given** a CLI install attempt
**When** the install completes (success or fail)
**Then** an event is POSTed to `cdn.datasetai.xyz/telemetry` (Cloudflare Worker endpoint) with: `agent_id`, `version`, `tool_detected`, `format`, `success`, `error_code`, anonymous `install_id`, CLI version
**And** `install_id` is a UUID generated once on first run, stored in `~/.datasetai/install-id`
**And** no PII is included (no IPs beyond coarse country, no auth tokens, no project paths)
**And** setting `DATASETAI_TELEMETRY=0` disables the POST entirely
**And** the first-run banner mentions telemetry + opt-out
**And** events are aggregated in PostHog via Cloudflare Worker → PostHog event ingest

---

### Story E3.14 — Web Install UI

As a **visitor on the web**,
I want **a clear "install this agent" call-to-action**,
So that **I can copy the install command quickly**.

**Sizing:** S
**Dependencies:** E2.2
**Coverage:** FR-INW-1, FR-INW-2, FR-INW-3

**Acceptance Criteria:**

**Given** a listing detail page
**When** the page renders
**Then** an install panel shows the default install command with a copy button
**And** if the agent is multi-format, tool-specific variants are surfaced via tabs (`Claude Code`, `Cursor`, etc.)
**And** an "Open in Terminal" button attempts to open the user's default terminal via system handler URL where supported (best-effort, browser-dependent)
**And** copying the command emits a `install_command_copied` PostHog event

---

# Epic 4 — Publishing

> *Goal: Creators can publish, manage, and version their own agents.*

**Phase:** 1C
**Total stories:** 10
**Sizing:** L
**Dependencies:** E1, E2

---

### Story E4.1 — Creator Signup via GitHub OAuth

As a **creator**,
I want **to create a creator account by signing in with GitHub**,
So that **publishing is friction-free and my repo ownership is verifiable**.

**Sizing:** XS
**Dependencies:** E1.3
**Coverage:** FR-PUB-1

**Acceptance Criteria:**

**Given** a logged-in user
**When** they navigate to `/publish` for the first time
**Then** they're prompted to accept the Creator Agreement
**And** their `users.github_id`, `github_login` are linked
**And** they get a default profile page at `/u/<github-login>`

---

### Story E4.2 — Web Publish Flow (Direct Upload)

As a **creator**,
I want **to upload a folder or zip and have it become a listing**,
So that **publishing is approachable for non-CLI users**.

**Sizing:** L
**Dependencies:** E4.1, E4.3, E4.4, E4.5
**Coverage:** FR-PUB-2, FR-PUB-5, FR-PUB-8

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they navigate to `/publish` and upload a folder/zip
**Then** the system detects format(s) (E4.3), runs linter (E4.4), and shows a preview
**And** if linter passes, the creator can edit metadata (name, description, category, tags, license) and submit
**And** on submit, an immutable `agent_version` is created with content hash, content uploaded to R2, manifest published to CDN
**And** the listing is live at `/agents/<agent-id>` within 30 seconds
**And** the creator is redirected to their listing detail page

---

### Story E4.3 — Format Auto-Detection on Publish

As a **creator**,
I want **the system to detect format(s) automatically**,
So that **I don't have to choose manually**.

**Sizing:** S
**Dependencies:** E3.3, E3.4
**Coverage:** FR-PUB-3, FR-PUB-8

**Acceptance Criteria:**

**Given** uploaded files
**When** the publish pipeline inspects them
**Then** each registered FormatAdapter's `detect()` runs
**And** the system proposes detected formats to the creator
**And** the creator can confirm or override (e.g. "this is a multi-format agent shipping both Claude Skill and an MCP server")

---

### Story E4.4 — Linter on Publish

As a **creator**,
I want **clear linter feedback before publishing**,
So that **I catch issues early**.

**Sizing:** S
**Dependencies:** E3.3, E3.4
**Coverage:** FR-PUB-4

**Acceptance Criteria:**

**Given** uploaded files
**When** the linter runs (per detected FormatAdapter `validate`)
**Then** errors are blocking; warnings are non-blocking
**And** errors include line/file context where applicable (e.g. "SKILL.md frontmatter missing required `description`")
**And** common pitfalls have actionable hints (e.g. "Tag your agent with at least 3 categories for better discoverability")

---

### Story E4.5 — Immutable AgentVersion + Content-Hash Storage

As a **system**,
I want **every publish to create a content-addressed immutable version**,
So that **installs are reproducible and dedup is automatic**.

**Sizing:** M
**Dependencies:** E1.2, E1.4
**Coverage:** FR-PUB-5, NFR-REL-3, Architecture AD-4

**Acceptance Criteria:**

**Given** a publish request with content
**When** the publish pipeline runs
**Then** a deterministic tarball is built and SHA-256 hashed
**And** if the hash already exists in R2, the upload is skipped (dedup)
**And** an `agent_versions` row is inserted with `content_hash`, `content_url`, `manifest_url`
**And** the manifest JSON is written to `cdn.datasetai.xyz/agents/<id>/<version>.json` AND `.../latest.json`
**And** all manifest writes use `Cache-Control: public, immutable, max-age=31536000`

---

### Story E4.6 — Edit Metadata Without Version Bump

As a **creator**,
I want **to edit description/tags/category without bumping version**,
So that **fixing a typo doesn't churn my installed-base**.

**Sizing:** XS
**Dependencies:** E4.2
**Coverage:** FR-PUB-6

**Acceptance Criteria:**

**Given** a published listing owned by the creator
**When** they edit description/tags/category from `/me/agents/<id>/edit`
**Then** the `agents` row updates but no new `agent_versions` row is created
**And** the manifest is regenerated to reflect new metadata
**And** the edit is reflected on the listing page within 60s (ISR revalidation)

---

### Story E4.7 — Unpublish Version

As a **creator**,
I want **to unpublish a version**,
So that **I can hide a broken release without deleting history**.

**Sizing:** XS
**Dependencies:** E4.5
**Coverage:** FR-PUB-7

**Acceptance Criteria:**

**Given** a creator's published version
**When** they click "Unpublish version"
**Then** `unpublished_at` is set on the version
**And** the version is no longer installable via CLI or web
**And** existing installed copies on user machines are unaffected
**And** the version is hidden from the version-selector unless "show unpublished" is toggled (creator-only)

---

### Story E4.8 — Multi-Format Publish

As a **creator**,
I want **to ship multiple formats in one listing**,
So that **users on different tools can install the same logical agent**.

**Sizing:** S
**Dependencies:** E4.2, E4.3
**Coverage:** FR-PUB-8

**Acceptance Criteria:**

**Given** a creator uploading content
**When** detection finds multiple formats (e.g. SKILL.md + MCP server manifest)
**Then** the creator can confirm both as part of a single listing
**And** the listing's `formats` array contains all
**And** install resolution picks the right format per detected tool (E3.5)

---

### Story E4.9 — `datasetai publish` CLI Command (cut from MVP — Phase 2)

As a **creator**,
I want **to publish from my terminal**,
So that **I can integrate publishing into CI/CD**.

**Sizing:** M — cut from MVP, ships in Phase 2
**Dependencies:** E3.1, E4.2
**Coverage:** FR-INC-11
**Note:** Cut from MVP per cleanup pass 2026-05-02. Web upload (E4.2) covers the launch case; CLI publish is a Phase 2 power-user feature.

**Acceptance Criteria:**

**Given** an authenticated CLI session (`datasetai login` completed)
**When** the user runs `datasetai publish <path>`
**Then** the CLI tarballs the path, validates locally via FormatAdapters, and uploads via the publish API
**And** prints the resulting listing URL
**And** `--draft` flag publishes as draft (not yet visible to public)

> 🔴 **Cut from MVP scope on 2026-05-02.** Implement in Phase 2.

---

### Story E4.10 — Manifest Publish Job (Async)

As a **system**,
I want **manifest writes to be async-resilient**,
So that **a transient R2 failure doesn't kill the publish flow**.

**Sizing:** S
**Dependencies:** E1.4, E4.5
**Coverage:** Architecture AD-5

**Acceptance Criteria:**

**Given** an `agent_versions` row was created
**When** the publish-manifest BullMQ job runs
**Then** it generates the manifest JSON and uploads to R2 with proper Cache-Control
**And** retries on transient failure (3 attempts with backoff)
**And** if final failure, alerts on-call via Sentry
**And** the listing page renders even if the CDN manifest is briefly stale (uses Postgres as fallback for first request)

---

# Epic 5 — Auto-Mirror & Supply Seeding

> *Goal: Index 8K–12K listings from approved sources with attribution + claim CTAs by launch.*

**Phase:** 1D
**Total stories:** 11
**Sizing:** XL
**Dependencies:** E1, E2

---

### Story E5.1 — Worker Service + BullMQ + Upstash Redis

As a **maintainer**,
I want **a Fly.io-hosted worker service running BullMQ**,
So that **background jobs run reliably and observably**.

**Sizing:** M
**Dependencies:** E1.1, E1.7
**Coverage:** Architecture §2.4, NFR-OBS-1..3

**Acceptance Criteria:**

**Given** the worker codebase
**When** deployed to Fly.io
**Then** BullMQ workers connect to Upstash Redis
**And** Bull Board admin UI is exposed at `/admin/jobs` behind admin auth
**And** every job emits structured logs to Axiom + errors to Sentry
**And** cron-scheduled jobs are defined in `apps/worker/src/jobs/cron.ts`

---

### Story E5.2 — SourceAdapter Contract

As a **worker engineer**,
I want **a `SourceAdapter` contract**,
So that **each mirror source has a uniform integration shape**.

**Sizing:** S
**Dependencies:** E5.1
**Coverage:** Architecture AD-3, FR-MIR-1

**Acceptance Criteria:**

**Given** the `@datasetai/source-adapters` package
**When** an adapter is registered
**Then** it implements `id`, `fetch()` (async generator yielding RawAgents), `attribution()`, `license()`, `contentHash()`
**And** the adapter has a `dryRun` mode that emits but does not persist
**And** unit tests cover happy path + upstream-failure + rate-limit scenarios

---

### Story E5.3 — Mirror Source: VoltAgent / awesome-agent-skills

As an **operator**,
I want **VoltAgent's 1,400+ skills mirrored**,
So that **datasetai launches with anchor supply density**.

**Sizing:** M
**Dependencies:** E5.2
**Coverage:** FR-MIR-1, Supply Plan Tier 1

**Acceptance Criteria:**

**Given** the VoltAgent SourceAdapter
**When** the mirror cron runs
**Then** all listed skills are ingested into `agents` + `agent_versions` with `source_type='voltagent-mirror'`
**And** attribution preserves the original repo URL + author
**And** content hash dedupes across re-runs
**And** subsequent runs only ingest deltas (resumable via cursor)
**And** licenses are preserved from upstream

---

### Story E5.4 — Mirror Source: alirezarezvani/claude-skills

As an **operator**,
I want **alirezarezvani/claude-skills mirrored**,
So that **multi-tool skills are well represented**.

**Sizing:** S
**Dependencies:** E5.2
**Coverage:** FR-MIR-1, Supply Plan Tier 1

**Acceptance Criteria:**

**Given** the alirezarezvani SourceAdapter
**When** the mirror runs
**Then** 232+ skills are ingested with full attribution and per-skill license

---

### Story E5.5 — Mirror Source: Smithery (Metadata Only)

As an **operator**,
I want **Smithery's MCP-server catalog indexed by metadata**,
So that **MCP-server discovery is unified**.

**Sizing:** M
**Dependencies:** E5.2
**Coverage:** FR-MIR-1, Supply Plan Tier 3

**Acceptance Criteria:**

**Given** the Smithery SourceAdapter
**When** the mirror runs
**Then** Smithery listings are indexed with `source_type='smithery-mirror'`
**And** the listing detail's install panel shows "Install via Smithery" (deep-links to Smithery's CLI / one-click install) instead of native install
**And** we do not duplicate Smithery's hosted runtime

---

### Story E5.6 — Mirror Source: prompts.chat

As an **operator**,
I want **prompts.chat content mirrored**,
So that **the most popular community prompts are findable on datasetai**.

**Sizing:** S
**Dependencies:** E5.2
**Coverage:** FR-MIR-1, Supply Plan Tier 1

**Acceptance Criteria:**

**Given** the prompts.chat SourceAdapter
**When** the mirror runs
**Then** prompts are ingested with `format='system-prompt'` (this is a Phase-2 supported format; for v1 we surface listings but install may show "format coming soon" — engineering decision)

> Engineering note: if `system-prompt` format isn't shipped in MVP, surface as listings but flag installs as Phase 2. Confirms Q1.

---

### Story E5.7 — Source Attribution Rendering

As a **visitor on a mirrored listing**,
I want **clear attribution and a path to claim it**,
So that **trust is preserved**.

**Sizing:** S
**Dependencies:** E2.2, E5.3
**Coverage:** FR-MIR-2

**Acceptance Criteria:**

**Given** a mirrored listing
**When** it renders
**Then** a banner shows "Mirrored from <source-name> on <date>" with a link to the upstream URL
**And** a "Claim this listing" CTA is visible with explainer copy
**And** upstream license is displayed prominently
**And** the listing's creator name shows "<upstream-author> (unclaimed)" until claimed

---

### Story E5.8 — Claim Listing Flow

As a **creator who finds my work mirrored**,
I want **to claim my listing by proving GitHub ownership**,
So that **I can manage and (Phase 2) monetize it**.

**Sizing:** L
**Dependencies:** E1.3, E5.7
**Coverage:** FR-MIR-3, Architecture AR-9

**Acceptance Criteria:**

**Given** an unclaimed mirrored listing
**When** a logged-in user clicks "Claim this listing"
**Then** the system checks if their GitHub account has commit/contributor rights to the upstream repo (not just repo-existence) via GitHub API
**And** if yes, transfers control: `creator_id` is set, listing moves into the claimer's dashboard, source-attribution remains
**And** if no, displays "Unable to verify ownership; contact support@" with a manual claim path
**And** the upstream maintainer receives a notification email if they have an account on datasetai

---

### Story E5.9 — Suppression List + Admin UI

As an **upstream maintainer**,
I want **to request suppression of my content**,
So that **I retain control**.

**Sizing:** M
**Dependencies:** E1.2, E5.7
**Coverage:** FR-MIR-4, Architecture AD-12

**Acceptance Criteria:**

**Given** the public mirror policy
**When** a maintainer emails or files a suppression request via the documented form
**Then** an admin enters a row in the `suppressions` table with appropriate `scope`
**And** active suppressions are checked on every ingest job AND on every publish/listing render
**And** suppressed items are hidden from public catalog within 5 minutes of admin action
**And** SLA: < 72h turnaround from request to action
**And** admin UI lists active/resolved suppressions with audit history

---

### Story E5.10 — Mirror Refresh Cadence

As a **system**,
I want **mirrored listings refreshed on a schedule**,
So that **content stays current**.

**Sizing:** S
**Dependencies:** E5.3..E5.6
**Coverage:** FR-MIR-5

**Acceptance Criteria:**

**Given** mirror jobs configured
**When** the cron runs
**Then** weekly: full refresh of all sources
**And** daily: refresh of top-1000 listings by 30-day install count
**And** per-source rate limits + robots.txt are honored
**And** failed refreshes alert via Sentry

---

### Story E5.11 — License Preservation

As a **system**,
I want **upstream licenses preserved everywhere**,
So that **we never re-license content**.

**Sizing:** XS
**Dependencies:** E5.3
**Coverage:** FR-MIR-6

**Acceptance Criteria:**

**Given** an ingested item with an upstream license
**When** stored and displayed
**Then** the license SPDX ID (or "Custom" / "Unknown") is preserved on the `agents` row
**And** displayed prominently on the listing page
**And** listings with "Unknown" license display a warning banner

---

# Epic 6 — Creator Dashboard

> *Goal: Creators see their installs, by-tool breakdown, and version performance.*

**Phase:** 1E
**Total stories:** 5
**Sizing:** M
**Dependencies:** E1, E2, E3, E4

---

### Story E6.1 — Install Metrics (Lifetime / 7d / 30d)

As a **creator**,
I want **to see my install counts over time**,
So that **I know what's working**.

**Sizing:** S
**Dependencies:** E1.2, E3.13
**Coverage:** FR-DSH-1

**Acceptance Criteria:**

**Given** an authenticated creator with published agents
**When** they navigate to `/me/agents/<id>/dashboard`
**Then** the dashboard shows lifetime, 7d, 30d install counts as numbers + sparkline
**And** counts are computed from the `installs` table (success=true only)
**And** dashboards refresh on visit (no caching beyond 60s)

---

### Story E6.2 — By-Tool Breakdown

As a **creator**,
I want **to see installs by detected tool**,
So that **I know who my users are**.

**Sizing:** XS
**Dependencies:** E6.1
**Coverage:** FR-DSH-2

**Acceptance Criteria:**

**Given** the dashboard
**When** rendered
**Then** a stacked bar/donut chart shows installs grouped by `tool_detected`
**And** "unknown" tool is shown for installs without detection

---

### Story E6.3 — Listing Performance (Views, Search Rank)

As a **creator**,
I want **to see my listing's performance**,
So that **I can optimize**.

**Sizing:** S
**Dependencies:** E6.1
**Coverage:** FR-DSH-3

**Acceptance Criteria:**

**Given** the dashboard
**When** rendered
**Then** PostHog data is pulled for `listing_viewed` events (last 30 days)
**And** top search queries that surfaced this listing are shown (from PostHog `search_performed` filtered by result-set-contains-this-id)
**And** average search-rank position is shown

---

### Story E6.4 — Version Performance

As a **creator**,
I want **to see installs per version**,
So that **I track migration**.

**Sizing:** XS
**Dependencies:** E6.1
**Coverage:** FR-DSH-4

**Acceptance Criteria:**

**Given** an agent with multiple versions
**When** the dashboard renders
**Then** a table shows version × install-count over the last 30d

---

### Story E6.5 — CSV Export

As a **creator**,
I want **to export my metrics**,
So that **I can analyze offline**.

**Sizing:** XS
**Dependencies:** E6.1
**Coverage:** FR-DSH-5

**Acceptance Criteria:**

**Given** the dashboard
**When** the creator clicks "Export CSV"
**Then** a CSV downloads containing per-day install counts for the last 90 days, with columns: date, agent_id, version, tool_detected, count

---

# Epic 7 — Trust & Moderation

> *Goal: Lightweight v1 trust mechanics — verified-publisher review, listing reports, admin moderation.*

**Phase:** 1E/1F
**Total stories:** 6
**Sizing:** M
**Dependencies:** E1, E2, E4

---

### Story E7.1 — Verified-Publisher Application + Admin Queue

As a **creator**,
I want **to apply for verified-publisher review**,
So that **I can earn the trust badge**.

**Sizing:** S
**Dependencies:** E1.3
**Coverage:** FR-TRS-1, Architecture AD-13

**Acceptance Criteria:**

**Given** an authenticated creator
**When** they navigate to `/me/verification` and submit
**Then** a `verification_applications` row is created
**And** admins see it in `/admin/verifications`
**And** approve/reject is a button click that updates `users.is_verified_publisher`
**And** rejection includes a `reviewer_note` shown to the creator

---

### Story E7.2 — Verified-Publisher Badge Display

As a **visitor**,
I want **to see verified-publisher badges**,
So that **I can trust quality**.

**Sizing:** XS
**Dependencies:** E7.1, E2.2
**Coverage:** FR-TRS-2

**Acceptance Criteria:**

**Given** a verified-publisher creator
**When** their listings render
**Then** a checkmark badge appears next to their name on the catalog card, listing detail, and profile page
**And** the badge tooltip explains the verification process and links to a public criteria page

---

### Story E7.3 — Listing Report Flow

As a **user**,
I want **to report a listing for malware/spam/copyright**,
So that **the platform stays clean**.

**Sizing:** S
**Dependencies:** E2.2
**Coverage:** FR-TRS-3

**Acceptance Criteria:**

**Given** a listing detail page
**When** a user clicks "Report"
**Then** a modal opens with reason categories (malware, prompt injection, copyright, spam, broken/non-functional, other)
**And** an optional details field
**And** submit creates a `reports` row with status=pending
**And** the user (if logged in) gets an email confirmation
**And** rate limit: 3 reports/hour/user

---

### Story E7.4 — Admin Moderation Queue

As an **admin**,
I want **a queue of reports to triage**,
So that **moderation is structured**.

**Sizing:** M
**Dependencies:** E7.3
**Coverage:** FR-TRS-3

**Acceptance Criteria:**

**Given** the admin role
**When** admin navigates to `/admin/reports`
**Then** pending reports list with: agent_id, reason, reporter, created_at, agent quick-view
**And** actions: take down listing, dismiss report, request creator clarification, escalate
**And** every action writes to a `resolution_note` audit log
**And** taking down a listing sets `unpublished_at` on the agent and notifies the creator

---

### Story E7.5 — Required License Field on Publish

As a **system**,
I want **every publish to declare a license**,
So that **users know their rights**.

**Sizing:** XS
**Dependencies:** E4.2
**Coverage:** FR-TRS-4

**Acceptance Criteria:**

**Given** a creator publishing
**When** they submit
**Then** license is a required field (SPDX dropdown + "Custom" + "None")
**And** if "None" or "Custom" with empty text, a warning banner appears on the listing
**And** the linter (E4.4) emits a warning if license is None/Custom

---

### Story E7.6 — Content Policy Enforcement Workflow

As a **maintainer**,
I want **a documented content-policy enforcement workflow**,
So that **takedowns are auditable and fair**.

**Sizing:** S
**Dependencies:** E1.6, E7.4
**Coverage:** FR-TRS-5, NFR-CMP-3

**Acceptance Criteria:**

**Given** the public Content Policy at `/content-policy`
**When** an admin takes down a listing
**Then** the action is logged in an audit table with: admin user, action, target, reason, timestamp
**And** the creator is emailed with the policy section cited
**And** the creator can appeal via a documented process (email-based at MVP)
**And** appeals are tracked alongside reports

---

## Final Validation

### Coverage check
- ✅ All MVP-scope FRs (FR-DSC-1..8, FR-INW-1..3, FR-INC-1..9 + 12, FR-PUB-1..8, FR-MIR-1..6, FR-DSH-1..5, FR-TRS-1..5) are mapped to at least one story
- ✅ Stretch FRs (FR-INC-10, FR-INC-11) are explicitly flagged
- ✅ All NFRs are mapped to at least one story (E1.7 catches the cross-cutting concerns)
- ✅ Architecture decisions translate to stories (AD-2 → E3.3/E3.4, AD-3 → E5.2, AD-4 → E4.5, AD-5 → E1.4 + E3.2, AD-6 → E3.5, AD-7 → E2.3, AD-9 → E3.13, AD-12 → E5.9, AD-13 → E7.1, AD-14 → E1.5)
- ✅ Phase-2 schema hooks (Stripe Connect — AD-10) are designed in E1.2 but feature-flagged off

### Dependency graph (sanity)
```
E1 (Foundations) → E2, E3, E4, E5
E2 → E3 (catalog must exist for installs to resolve)
E2 + E1 → E5 (auto-mirror writes to catalog)
E1 + E2 + E3 + E4 → E6 (dashboard needs install events)
E1 + E2 + E4 → E7 (trust acts on listings)
```

### Stretch / cut decisions documented (updated 2026-05-02 cleanup pass)
- E3.12 (`update`) — **CUT FROM MVP**, ships in Phase 2 (users can `uninstall` + `install` to update)
- E4.9 (`datasetai publish` from CLI) — **CUT FROM MVP**, ships in Phase 2 (web upload covers launch case)
- E5.6 (prompts.chat mirror) — system-prompt format support is Phase 2; surfacing-but-flagging acceptable
- E2.9 (personalized homepage) — static at MVP, dynamic personalization in Phase 2

### Risks not yet covered by stories
- AR-6 (manifest signing) — open architectural question, not yet a story; if greenlit, becomes E1.4b or new story
- Founding-creator concierge onboarding — not a story; lives in Supply Bootstrap Plan as ops work
- Anchor agent commissioning — not a story; lives in Supply Bootstrap Plan as content work

### Total scope (updated 2026-05-02 cleanup pass)
- **65 numbered sprintable stories** across 7 epics (sub-tasks/AC make ~115 total line items)
- Of these, **2 are CUT FROM MVP and shipped in Phase 2** (E3.12 `update`, E4.9 CLI publish)
- Net MVP scope: **63 stories**
- Of these, **10 are pre-launch foundations** (Epic 1: E1.1, E1.2a, E1.2b, E1.3, E1.4, E1.4b, E1.5, E1.6, E1.7, E1.8) that must precede everything

---

## Source Documents
- [PRD](./prd.md) — §9 FRs, §10 NFRs, §11 epic outlines
- [Architecture](./architecture.md) — §3 ADRs, §5 system structure
- [Product Brief](./product-brief-datasetai-2026-05-02.md) — vision, scope
- [Market Research](./research/market-llm-agent-marketplace-research-2026-05-02.md)
- [Supply Bootstrap Plan](./supply-bootstrap-plan-2026-05-02.md)

---

_End of Epic Breakdown v0.1 (yolo). Next: review, then `bmad-check-implementation-readiness` for a coherence gate before any code is written, then `bmad-create-story` (per-story expansion) when ready to start sprinting._
