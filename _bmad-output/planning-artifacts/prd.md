---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-datasetai-2026-05-02.md'
  - '_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md'
documentCounts:
  briefCount: 1
  researchCount: 1
  brainstormingCount: 0
  projectDocsCount: 0
projectType: 'greenfield'
workflowType: 'prd'
project_name: 'datasetai.xyz'
user_name: 'Semma'
date: '2026-05-02'
prd_version: 'v0.1 — yolo draft for review'
mode: 'yolo'
---

# Product Requirements Document — datasetai.xyz

**Author:** Semma
**Date:** 2026-05-02
**Version:** v0.1 (yolo draft, ready for review and iteration)
**Status:** Draft — pre-implementation

---

## 1. Vision

**One-line vision:** *npm for AI agents — every coding agent, every LLM, every format, with a creator economy underneath.*

**Three-year vision:** datasetai.xyz becomes the default destination for cross-tool agent distribution and the de facto creator-economy layer for the AI-agent ecosystem. When a developer builds a useful agent (in any format, for any tool), datasetai is where they publish — because that is where the audience and the revenue are. When a user needs an agent, datasetai is where they go — because every format lives there, with eval scores they trust, in the format their tool needs.

**Mission:** make agent-building a viable creator profession — the way YouTube made video, Substack made writing, and the App Store made indie iOS development.

---

## 2. Executive Summary

datasetai.xyz is a **format-agnostic registry** where developers and prosumers upload AI-agent definition files (`SKILL.md`, MCP server configs, `AGENTS.md`, `.cursorrules`, system prompts, framework configs) and other users discover and one-command install them into whichever AI tool they happen to use — Claude Code, Cursor, Codex CLI, Aider, Gemini CLI, or raw API calls.

The 2026 AI-agent ecosystem is mid-explosion (MCP servers +58% QoQ, AGENTS.md adopted across 60K+ projects, Cursor at 1M+ DAU and $2B annualized revenue) and fragmented across format-narrow registries (Smithery, cursor.directory, prompts.chat) and unmonetized awesome-lists. **No incumbent occupies the multi-format-and-creator-monetized quadrant.** That is datasetai's wedge. It must be claimed before Anthropic, OpenAI, and Cursor each launch ecosystem-locked first-party registries (estimated 12–24 month window).

The MVP (Phase 1, months 0–6) ships a web registry plus a `npx datasetai install <agent>` CLI, supporting **Claude Code Skills + MCP servers** as the launch formats — both have the strongest growth and weakest monetization-incumbents. Phase 2 adds AGENTS.md, `.cursorrules`, and creator monetization. Phase 3 adds private/team/enterprise registries.

The product is **registry-only**. No hosted execution. Zero compute cost. Software-margins from day one. Bootstrappable.

> 📚 Anchored to: [Product Brief](./product-brief-datasetai-2026-05-02.md) and [Market Research](./research/market-llm-agent-marketplace-research-2026-05-02.md).

---

## 3. Goals & Success Metrics

### 3.1 Phase-1 (MVP, 0–6 months) — *"prove the wedge"*

| Goal | Metric | Target |
|---|---|---|
| Working install UX | Time-to-first-install (browse → install command → working agent) | **< 60 seconds** |
| Cross-tool reach | Supported tools at launch | **≥ 3** (Claude Code, Claude Desktop/MCP, one of Cursor/Codex/Aider) |
| Indexed supply density | Agent listings (mostly auto-mirrored) | **≥ 10,000** |
| Active supply | Listings claimed-and-maintained by their creator | **≥ 500** |
| Demand | Monthly active users (browsers + installers) | **25,000–50,000** |
| Verified publishers | Creators who claim listing + opt-in | **≥ 200** |
| Install success rate | Installs that complete without manual fix-up | **≥ 95%** |

### 3.2 Year-1 milestones

- $50K–$300K ARR (paid tiers begin Phase 2, month 6+)
- 10K–50K MAU
- ≥ 1,000 monetizing creators
- 10+ supported formats

### 3.3 Year-2 / Year-3 milestones

- Year 2: $500K–$2M ARR, 100K–500K MAU
- Year 3: $2M–$15M ARR, 1M+ MAU — credible acquisition or standalone-venture point

### 3.4 Anti-goals (what we are *not* optimizing for)

- ❌ Hosted agent execution — permanently out of scope
- ❌ Building our own LLM, fine-tuning, or evals-as-a-service infrastructure beyond what supports the registry
- ❌ Mobile app
- ❌ Competing with Smithery on raw MCP-server count — we *include* Smithery as a source, not duplicate it
- ❌ Becoming a "general developer marketplace" — agents only

---

## 4. Personas & User Journeys

### 4.1 Primary personas

#### Persona A — "Indie Builder Ivan"
- 28, full-stack developer, ships agents in his free time
- Already has a GitHub awesome-list with 800 stars
- Burned by GPT Store payouts ($23 last quarter on 4K conversations)
- Goals: monetize his agent work, build an audience across tools, see real analytics
- Frustration: format fragmentation — the same logical agent has to be re-published as `.cursorrules`, SKILL.md, and an MCP server in three different repos

#### Persona B — "Prosumer Patricia"
- 42, sales-ops consultant, builds vertical agents for legal & sales workflows
- No-code-leaning; uses Claude Code through a UI wrapper, builds skills via the BMAD-builder workflow
- Goals: turn her domain expertise into a passive income stream
- Frustration: PromptBase doesn't support skills/MCP, and GitHub feels too technical to publish on

#### Persona C — "Agent User Anna"
- 31, software engineer at an SMB
- Heavy Cursor user; recently added Claude Code; experimenting with Aider
- Wants to grab high-quality, vetted agents without writing them from scratch
- Goal: find, install, and trust an agent in under 5 minutes
- Frustration: `cursor.directory` only has Cursor stuff; she has to bounce between 5 sites

#### Persona D (Phase 3) — "Enterprise Edward"
- VP of Engineering at a 200-person SaaS company
- Wants a **private, governed** registry of approved agents for his org
- Goals: SOC2-friendly, SSO, audit log, on-prem option, no public exposure
- Frustration: "we'd love to roll out internal agents but legal won't let us without compliance gates"

### 4.2 Critical user journeys (MVP)

#### Journey 1 — Anna installs an agent (the demand-side path)
1. Anna googles "claude code skill for code review" → lands on a datasetai listing
2. Sees: title, what it does, who made it, install count, last-updated, supported tools (icons), eval score (Phase 3), reviews
3. Clicks install → sees a copy-button with `npx datasetai install <agent-id>`
4. Pastes into terminal → CLI auto-detects she has `.claude/` in her project → writes the SKILL.md and any companion MCP config to the right folders
5. CLI prints: *"✅ Installed. In Claude Code, run `/code-review` or restart your session to pick up the new skill."*
6. Anna runs it. Works. She returns to the listing and clicks ⭐.

#### Journey 2 — Ivan claims and monetizes a listing (the supply-side path)
1. Ivan finds his old GitHub repo *already auto-mirrored* on datasetai with attribution to his GitHub
2. Sees a "Claim this listing" CTA → OAuth's via GitHub (proves repo ownership)
3. Now manages the listing: edits description, tags, title, add screenshots/usage examples
4. Sees analytics: installs, weekly trend, install-by-tool breakdown
5. (Phase 2) toggles "monetize" → sets price ($4.99 one-time or $2/mo subscription) → connects Stripe → publishes paid version

#### Journey 3 — Patricia publishes a brand-new agent (the green-supply path)
1. Patricia clicks "Publish" → uploads a folder containing SKILL.md + supporting files
2. UI infers tool compatibility (parses for Claude Skill format) and asks if she wants to also publish an MCP-server companion
3. Linter: validates SKILL.md frontmatter, flags missing `description` field, suggests tags
4. Preview: shows what the listing will look like + the install command
5. Publish → listing live. Optionally: opt into "verified-publisher review" (manual review for the trust badge).

#### Journey 4 — Cross-tool install (the differentiation moment)
1. Anna finds an agent labeled "works on: Claude Code, Cursor, Codex CLI"
2. Runs `npx datasetai install <agent-id> --tool=cursor` (or omits flag → auto-detects Cursor as primary)
3. CLI converts/exports the agent into the Cursor `.cursor/rules` format and writes it
4. Listing tracks "installs by tool" — Ivan sees that 60% of his installs are Cursor users, not Claude

---

## 5. Domain Model & Glossary

### 5.1 Core entities

| Entity | Description |
|---|---|
| **Agent** | A published artifact: name + version + description + tool-compatibility list + content (one or more files) + metadata. Versioned via SemVer. |
| **AgentVersion** | A specific version of an agent (e.g. `bmad-skill-architect@1.4.0`). Immutable once published; new versions create new AgentVersion records. |
| **Format** | An agent definition format: `claude-skill`, `mcp-server`, `agents-md`, `cursorrules`, `system-prompt`, `bmad`, `crewai-config`, etc. An AgentVersion declares one or more Formats it ships in. |
| **Tool** | An end-user AI tool: `claude-code`, `claude-desktop`, `cursor`, `codex-cli`, `aider`, `gemini-cli`, `windsurf`, etc. The CLI maps formats → tools. |
| **Creator** | A user account that publishes agents. Has GitHub OAuth, optional payout method (Phase 2). |
| **Listing** | The public-facing page for an agent. May be *claimed* (creator-managed) or *unclaimed* (auto-mirrored from a public source). |
| **Source** | Origin of a listing's content: `direct-publish`, `github-mirror`, `voltagent-mirror`, `smithery-mirror`, `skillsmp-mirror`. |
| **Install** | A recorded use of `npx datasetai install <agent>`. Tracks: agent, version, tool detected, success/failure, anonymous user-id (cookie or CLI-installation-id). |
| **Verified-Publisher Badge** | A trust marker awarded after manual review of a creator's identity + agent. Phase 2. |

### 5.2 Glossary

- **MCP** — Model Context Protocol; Anthropic-led open standard for connecting LLMs to external tools/data. ([Smithery](https://smithery.ai/), [PulseMCP](https://www.pulsemcp.com/statistics))
- **AGENTS.md** — Cross-tool open standard for instructing coding agents, stewarded by the Linux Foundation. ([agents.md](https://agents.md/))
- **SKILL.md** — Anthropic's Claude Code skill definition format; a markdown file with YAML frontmatter (`name`, `description`) and instructions.
- **Auto-mirror** — Periodic indexing of public agent collections (with attribution) so the registry is useful before claimed-creator density catches up.
- **Format adapter** — CLI logic that converts/exports an agent's content into the format/folder convention of a specific Tool.

---

## 6. Innovation & Differentiation

The PRD is consistent with the brief: **datasetai's competitive moat is the intersection of three currently-unoccupied positions.**

1. **Format-agnostic by design** — supports SKILL.md + MCP + AGENTS.md + `.cursorrules` + system prompts + framework configs, with format-adapters in the CLI. No competitor handles more than ~2 formats first-class.
2. **Creator-economy economics** — match PromptBase's 80% revenue share (Phase 2), with a 90% founding-creator window. *Nobody currently pays MCP authors or Claude-skill authors.*
3. **Quality and trust layer** — automated security scanning (closing the 61% OWASP gap), eval scores, verified-publisher review, refund policy on paid agents.

The non-moats (be honest):
- Registry pattern is well-known
- Auto-mirroring is technically simple
- The defensibility is **execution speed + format-coverage + creator monetization** — first-party registries from Anthropic/OpenAI/Cursor will only ever support their own format, so cross-tool position is structurally durable.

---

## 7. Project Type & Tech Posture

### 7.1 Project type
- **Greenfield** — no existing system to extend
- **B2C-leaning prosumer marketplace + B2B (Phase 3)** — both creators and users are "consumers" in Phase 1; private registries are the B2B hook in Phase 3
- **Web + CLI** — two surfaces, deeply integrated

### 7.2 Recommended tech stack (high-level — final call belongs to engineering)

These are *recommendations grounded in the constraints*, not a binding architecture:

- **Frontend:** Next.js (React, App Router) — strong SEO, React-ecosystem familiarity, good open-source patterns for marketplaces
- **Backend:** Node/TypeScript or Go for the API + CLI — both keep CLI distribution clean (single binary or `npx`-able package)
- **CLI distribution:** `npx datasetai install` (npm package) for v1 — instant, no install-friction, matches BMAD's own pattern
- **Database:** Postgres (listings, versions, users, installs); object storage (S3/R2/B2) for agent files; full-text search via Postgres or Meilisearch for v1
- **Auth:** GitHub OAuth (creators must prove repo ownership for claims); email/passwordless for browsing
- **Payments (Phase 2):** Stripe Connect for creator payouts, with research into crypto/platform-wallet rails for countries Stripe excludes (a key market gap from the GPT Store geo-lock)
- **Hosting:** Vercel (frontend) + Fly.io / Railway / similar (backend) — bootstrap-friendly
- **Observability:** PostHog for product analytics; Sentry for errors; structured logs to a cheap aggregator

### 7.3 Tech non-goals
- ❌ Microservices day one (one Next.js app + one backend service + Postgres is enough)
- ❌ Custom infrastructure for agent execution (we don't run agents)
- ❌ Server-side LLM API key management (users bring their own)
- ❌ Real-time collaboration features (out of scope for MVP)

---

## 8. Scoping — In, Out, Phased

### 8.1 IN scope for MVP (Phase 1, months 0–6)

**Discovery & browse**
- Public catalog with search, filters (format, tool, category, free/paid, last-updated, install-count), pagination, sort
- Listing detail pages with description, content preview, install command, version history, install count, supported tools, source attribution
- Category browsing
- Personalized homepage (start static at MVP; dynamic personalization in Phase 2)

**Publishing**
- GitHub OAuth login for creators
- Direct publish via web upload (zip / multi-file) or CLI publish (`npx datasetai publish`)
- "Claim listing" flow (verify GitHub repo ownership)
- Edit metadata, version, description on claimed listings
- Linter / validator on publish (frontmatter checks for SKILL.md, MCP config validation, etc.)

**Auto-mirror system**
- Background jobs to scrape and mirror VoltAgent/awesome-agent-skills, SkillsMP-indexed GitHub repos, prompts.chat, Smithery's public catalog
- Clear source attribution + "Claim this listing" CTA on every mirrored entry
- Outreach process (separate from product surface) to notify maintainers and request blessing
- Respect of robots.txt and existing rate-limit etiquette

**CLI**
- `npx datasetai install <agent-id>` — auto-detects local AI tool(s), writes file(s) to the correct folder(s)
- `npx datasetai search <query>` — quick CLI search
- `npx datasetai list` — list installed agents
- `npx datasetai uninstall <agent-id>`
- `npx datasetai publish` — publish from local folder (alternative to web upload)
- Format adapters: `claude-skill` → `.claude/skills/<name>/SKILL.md`, `mcp-server` → `~/.config/<tool>/mcp.json` (or appropriate per-tool path)

**Creator dashboard (basic)**
- Install counts (total, weekly, by-tool breakdown)
- Listing performance (search-rank position, page views)
- Version history

**Auth, accounts, basic admin**
- Email + GitHub OAuth login
- Public profile pages for creators
- Admin tooling for moderation (DMCA, content-policy violations)

**Trust hooks (lightweight v1)**
- Manual verified-publisher review process (request → review → badge)
- Report-listing button → admin queue
- License field on every listing (MIT, Apache-2, Custom, etc.)

**Format support (launch)**
- ✅ Claude Code Skills (`SKILL.md`)
- ✅ MCP servers (config + manifest)

### 8.2 OUT of scope for MVP (deferred to Phase 2 or later)

**Phase 2 (months 6–12)**
- Cross-format support: AGENTS.md, `.cursorrules`, Codex skills, Aider conventions, Gemini CLI configs
- Paid agents — Stripe Connect integration, creator payouts, refund policy
- Subscriptions (per-creator and per-platform)
- Agent bundles (pre-curated kits — "the Customer Support starter kit" = 1 skill + 3 MCP servers + 2 prompts)
- Enhanced creator dashboard (revenue, subscriber metrics, cohort analysis)
- Founding-creator program execution

**Phase 3 (year 2+)**
- Private / team / enterprise registries
- SSO (SAML, OIDC), audit logs, RBAC
- On-prem / air-gapped deployment
- Automated security scanning (malicious-code detection, prompt injection scanning)
- Sandboxed eval environment for trust scores
- API for programmatic install (CI/CD pipelines)
- Marketplace search SDK (embed datasetai search in third-party tools)

**Permanently OUT of scope**
- Hosted agent execution
- Hosted LLM inference
- Agent IDE (we are not Cursor)
- Mobile app

### 8.3 MVP success exit-criteria
We exit MVP and graduate to Phase 2 when *all* of:
- ≥ 25K MAU sustained for 30 days
- ≥ 200 verified publishers
- ≥ 95% install-success rate
- At least 5 anchor success stories from publishers (creators willing to be quoted publicly)

---

## 9. Functional Requirements

> *Format: `FR-{section}-{n} — {short title}`. Numbered for traceability into stories and tests.*

### 9.1 Discovery (FR-DSC)

- **FR-DSC-1 — Catalog browse.** Users can browse all public agents in a paginated catalog without authentication.
- **FR-DSC-2 — Full-text search.** Users can search agents by title, description, tags, and content with results returned in < 500ms p95.
- **FR-DSC-3 — Faceted filters.** Filter by format, tool compatibility, category, license, free/paid (paid in Phase 2), publisher type (verified or any), and last-updated.
- **FR-DSC-4 — Sort.** Sort by relevance (default), install count, recently updated, recently created.
- **FR-DSC-5 — Listing detail page.** Each agent has a public detail page showing: name, description, full content preview, install command (copy-button), version selector, supported tools (icon row), category, install count (lifetime + 30-day), license, source attribution, creator profile link, related agents.
- **FR-DSC-6 — Category & tag pages.** Browse agents by category (legal, sales-ops, code-review, etc.) and tag.
- **FR-DSC-7 — Creator profile pages.** Public profile per creator with bio, list of published agents, aggregate install count, GitHub link, badges.
- **FR-DSC-8 — Anonymous-user history.** Browser remembers recently-viewed listings for non-logged-in users (localStorage).

### 9.2 Install — Web (FR-INW)

- **FR-INW-1 — One-click copy install command.** Listing detail shows `npx datasetai install <agent-id>` with a one-click copy button.
- **FR-INW-2 — Tool-specific install variants.** If a multi-format agent is shown, the install panel surfaces per-tool variants: `--tool=claude-code`, `--tool=cursor`, etc.
- **FR-INW-3 — Web "open in CLI" deep-link.** A button that triggers a system-handler URL (where supported) to open the user's terminal with the install command pre-filled (best-effort, browser-dependent).

### 9.3 Install — CLI (FR-INC)

- **FR-INC-1 — `npx datasetai install <agent-id>`** installs the agent's default format into the appropriate folder for the user's detected primary tool.
- **FR-INC-2 — Auto-detection of local tool.** CLI inspects the working directory + standard config paths to detect which tool(s) are present, in this priority order: `.claude/` → `.cursor/` → `.codex/` → `.aider.conf.yml` → `~/.config/<tool>/`. Falls back to interactive prompt if none detected.
- **FR-INC-3 — Format selection flag.** `--format=<format>` overrides default format.
- **FR-INC-4 — Tool selection flag.** `--tool=<tool>` overrides auto-detected tool.
- **FR-INC-5 — Multi-tool install.** `--tool=cursor,claude-code` installs to multiple tools in one invocation.
- **FR-INC-6 — Version pinning.** `<agent-id>@<version>` installs a specific version; default = latest.
- **FR-INC-7 — `npx datasetai search <query>`** queries the catalog and returns top results in the terminal.
- **FR-INC-8 — `npx datasetai list`** lists agents installed in the current project (read from a local `.datasetai/manifest.json`).
- **FR-INC-9 — `npx datasetai uninstall <agent-id>`** removes installed files and updates the local manifest.
- **FR-INC-10 — `npx datasetai update [<agent-id>]`** updates installed agents to the latest compatible version.
- **FR-INC-11 — `npx datasetai publish`** publishes from a local folder (creator must be authenticated via `npx datasetai login`).
- **FR-INC-12 — Anonymous install telemetry.** CLI reports install events (agent, version, tool, success/failure, anonymous install-id) unless user opts out via `DATASETAI_TELEMETRY=0`.

### 9.4 Publishing (FR-PUB)

- **FR-PUB-1 — GitHub OAuth signup.** Creators authenticate via GitHub OAuth.
- **FR-PUB-2 — Direct web publish.** Web UI accepts a zip or multi-file upload, parses metadata, and creates a draft listing.
- **FR-PUB-3 — Format auto-detection on publish.** System inspects uploaded files and proposes the format(s) (Claude skill, MCP server, etc.).
- **FR-PUB-4 — Linter on publish.** Validates SKILL.md frontmatter (`name`, `description` required), MCP server manifest, etc. Errors block; warnings allow proceed.
- **FR-PUB-5 — Versioning.** Every publish creates a new immutable AgentVersion. SemVer recommended; non-SemVer accepted.
- **FR-PUB-6 — Edit metadata.** Creators can edit description, tags, category, README without bumping version. Functional content changes require a new version.
- **FR-PUB-7 — Unpublish version.** Creators can hide a version (kept in DB but not installable). Cannot delete past installs.
- **FR-PUB-8 — Multi-format publish.** A single listing can declare itself in multiple formats (e.g. ships both a SKILL.md *and* a Cursor `.cursorrules` variant).

### 9.5 Auto-mirror (FR-MIR)

- **FR-MIR-1 — Source ingestion jobs.** Scheduled background jobs ingest from approved sources (initial set: VoltAgent/awesome-agent-skills, SkillsMP-indexed GitHub repos, prompts.chat, Smithery public catalog, awesome-cursorrules).
- **FR-MIR-2 — Source attribution.** Every mirrored listing displays prominently: source name, source URL, license inherited from upstream, "Mirrored from <source> on <date>".
- **FR-MIR-3 — Claim flow for mirrored listings.** A "Claim this listing" CTA on every mirrored listing → flows to GitHub OAuth → verifies the user owns the upstream repo (via GitHub API) → transfers control to the user.
- **FR-MIR-4 — Mirror suppression.** Maintainers of upstream sources can request global suppression of their content via a documented process (email + DMCA-style flow). Honored in < 72 hours.
- **FR-MIR-5 — Refresh cadence.** Mirrored listings refresh on a schedule (weekly default, daily for top-1000-by-installs).
- **FR-MIR-6 — License preservation.** Upstream license preserved and displayed; no relicensing.

### 9.6 Creator dashboard (FR-DSH)

- **FR-DSH-1 — Install metrics.** Lifetime installs, 7-day, 30-day, all-time chart.
- **FR-DSH-2 — By-tool breakdown.** Installs broken out by detected tool (Claude Code vs. Cursor vs. ...).
- **FR-DSH-3 — Listing performance.** Page views, search-impressions, search-rank for top queries.
- **FR-DSH-4 — Version performance.** Per-version install counts so the creator can see version migration.
- **FR-DSH-5 — Export.** CSV export of all metrics.

### 9.7 Trust & moderation (FR-TRS)

- **FR-TRS-1 — Verified-publisher application.** Creators can apply for verified-publisher review (manual queue in MVP).
- **FR-TRS-2 — Verified-publisher badge.** Approved creators get a checkmark on profile and listings.
- **FR-TRS-3 — Listing report flow.** Any user can report a listing for: malware, prompt injection, copyright, spam, broken/non-functional. Goes to admin queue.
- **FR-TRS-4 — License field.** Required on publish; defaults to None/Custom with warning.
- **FR-TRS-5 — Content policy enforcement.** Admins can take down listings that violate published content policy.

---

## 10. Non-Functional Requirements

### 10.1 Performance
- **NFR-PRF-1 —** Catalog page p95 load time < 1.5 s globally
- **NFR-PRF-2 —** Search query p95 latency < 500 ms
- **NFR-PRF-3 —** Listing detail page p95 load time < 1.0 s
- **NFR-PRF-4 —** CLI `install` p95 latency < 5 s for a typical (≤ 100 KB) agent over a 50 Mbps connection
- **NFR-PRF-5 —** Pages SSR'd or statically rendered for SEO; client-side hydration where required

### 10.2 Scalability
- **NFR-SCL-1 —** Architecture supports 100K MAU and 1M monthly install events at MVP launch *capacity*; baseline cost optimized for 25K MAU
- **NFR-SCL-2 —** Listings table scales to 1M+ records with sub-500ms search
- **NFR-SCL-3 —** Mirror jobs scale horizontally; each job is independent and resumable

### 10.3 Reliability
- **NFR-REL-1 —** 99.5% web availability monthly (consumer-grade SLA at MVP)
- **NFR-REL-2 —** CLI install does not require the web app to be up — agents resolve via CDN-cached metadata; fall back to direct GitHub source for mirrored agents
- **NFR-REL-3 —** All listings are versioned and immutable once published — no silent content swaps

### 10.4 Security
- **NFR-SEC-1 —** All traffic over HTTPS
- **NFR-SEC-2 —** OWASP top-10 baseline (input validation, parameterized queries, secure session cookies, CSRF protection)
- **NFR-SEC-3 —** Rate limiting on auth, publish, and report endpoints
- **NFR-SEC-4 —** Secrets management via platform-native (Vercel/Railway/Fly), not in code
- **NFR-SEC-5 —** No credentials, no shell-execution, no hosted-runtime — minimizes blast radius
- **NFR-SEC-6 —** Phase 3: automated agent-content scanning for known malicious patterns and credential exfiltration vectors. (MVP relies on community reporting + manual review.)

### 10.5 Privacy
- **NFR-PRV-1 —** GDPR/CCPA-compliant data handling: clear privacy policy, data export, account deletion within 30 days
- **NFR-PRV-2 —** CLI telemetry is anonymous (install-id, never user PII), opt-out via env var
- **NFR-PRV-3 —** Creator GitHub OAuth scope: minimum (read:user, read:org as needed for repo ownership verification)

### 10.6 Accessibility
- **NFR-ACC-1 —** WCAG 2.1 AA on web surfaces
- **NFR-ACC-2 —** Keyboard-only navigation for all primary flows (browse, install, publish)
- **NFR-ACC-3 —** Screen-reader-friendly listing detail and search

### 10.7 Internationalization
- **NFR-I18N-1 —** UI in English at MVP; architecture supports i18n (no hardcoded strings)
- **NFR-I18N-2 —** Listings can be in any language; search supports non-Latin scripts
- **NFR-I18N-3 —** Phase 2: Russian, Spanish, German, Japanese, Mandarin (top regions for AI builders)

### 10.8 Observability
- **NFR-OBS-1 —** Product analytics on every key event (search, listing-view, install-attempt, install-success, install-fail, publish, claim)
- **NFR-OBS-2 —** Error tracking (Sentry-grade) with deploy-tagging
- **NFR-OBS-3 —** Structured logs for backend services
- **NFR-OBS-4 —** Public status page

### 10.9 Compliance
- **NFR-CMP-1 —** Tax handling for international creator payouts (Phase 2): work with Stripe Connect's tax tooling
- **NFR-CMP-2 —** DMCA process documented and implemented
- **NFR-CMP-3 —** Content-policy enforcement workflow (intake → review → action → audit-log)

### 10.10 Legal
- **NFR-LGL-1 —** Terms of Service tailored for two-sided marketplace
- **NFR-LGL-2 —** Creator agreement (publishing terms, IP claims, payouts)
- **NFR-LGL-3 —** End-user agreement (install responsibilities, license inheritance)
- **NFR-LGL-4 —** Privacy policy
- **NFR-LGL-5 —** Mirror policy (DMCA-style takedown procedure for upstream maintainers)

---

## 11. Epics & MVP Stories

> *Epics are organized by capability. Each epic groups stories that together deliver a coherent slice of value.*

### Epic 1 — Discovery & browse
- E1-S1: As a visitor, I can browse the public catalog without signing in
- E1-S2: As a visitor, I can search agents by free text
- E1-S3: As a visitor, I can filter by format, tool, category, license, recency
- E1-S4: As a visitor, I can sort by relevance / installs / updated / created
- E1-S5: As a visitor, I can view a listing detail with install command, content preview, source attribution
- E1-S6: As a visitor, I can view a creator's public profile and their published agents

### Epic 2 — Install via CLI
- E2-S1: As a user, I can run `npx datasetai install <agent>` and have it auto-detect my AI tool
- E2-S2: As a user, I can override the auto-detected tool with `--tool=<tool>`
- E2-S3: As a user, I can install a specific version with `<agent>@<version>`
- E2-S4: As a user, I can install one agent into multiple tools at once
- E2-S5: As a user, I can list, update, and uninstall agents
- E2-S6: As a user, I can search the catalog from the CLI

### Epic 3 — Auto-mirror & supply seeding
- E3-S1: As the system, I ingest VoltAgent/awesome-agent-skills with attribution
- E3-S2: As the system, I ingest SkillsMP-indexed top GitHub repos with attribution
- E3-S3: As the system, I ingest prompts.chat with attribution
- E3-S4: As the system, I ingest Smithery's public MCP catalog with attribution
- E3-S5: As an upstream maintainer, I can request suppression and have it honored within 72 hours

### Epic 4 — Publishing & creator account
- E4-S1: As a creator, I can sign up with GitHub OAuth
- E4-S2: As a creator, I can claim a mirrored listing by proving GitHub repo ownership
- E4-S3: As a creator, I can directly publish a new agent via web upload
- E4-S4: As a creator, I can directly publish via `npx datasetai publish`
- E4-S5: As a creator, I see linter feedback before publish
- E4-S6: As a creator, I can edit metadata on my listings without bumping version
- E4-S7: As a creator, I can release a new version (immutable)
- E4-S8: As a creator, I can unpublish a version

### Epic 5 — Creator dashboard
- E5-S1: As a creator, I see lifetime, 7d, 30d install counts per agent
- E5-S2: As a creator, I see installs broken down by tool
- E5-S3: As a creator, I see version-over-version install distribution
- E5-S4: As a creator, I see search-impressions and search-rank for my agents
- E5-S5: As a creator, I can export metrics to CSV

### Epic 6 — Trust & moderation (lightweight v1)
- E6-S1: As a creator, I can apply for verified-publisher review
- E6-S2: As an admin, I can approve/reject verified-publisher applications
- E6-S3: As any user, I can report a listing for malware / abuse / copyright
- E6-S4: As an admin, I have a moderation queue and can take down listings
- E6-S5: As a creator, I must declare a license on every publish

### Epic 7 — Foundational platform
- E7-S1: Auth (email + GitHub OAuth)
- E7-S2: User accounts and profiles
- E7-S3: Database schema for listings, versions, creators, installs
- E7-S4: Object storage for agent files
- E7-S5: Search infrastructure (Postgres FTS or Meilisearch)
- E7-S6: Background-job runner for mirrors
- E7-S7: CLI npm package + format adapters (Claude Skill, MCP server)
- E7-S8: Product analytics + error tracking + structured logging
- E7-S9: Privacy policy, ToS, Creator Agreement, DMCA process

---

## 12. Acceptance Criteria (high-level, MVP)

The MVP ships when all of the below are true:

### 12.1 Discovery & browse
- ☐ Catalog renders for unauthenticated users
- ☐ Search works on title, description, tags, content
- ☐ Filters work for: format, tool, category, license, free/paid, recency
- ☐ Listing detail shows: title, description, content preview, install command, version selector, install count, supported tools, license, source attribution
- ☐ Performance: catalog p95 < 1.5 s, search p95 < 500 ms

### 12.2 Install (CLI)
- ☐ `npx datasetai install <agent>` works on macOS, Linux, Windows for both Claude Code Skills and MCP servers
- ☐ Auto-detects Claude Code, Claude Desktop (MCP), and at least one of: Cursor / Codex / Aider
- ☐ `--tool=`, `--format=`, `<agent>@<version>` flags all work
- ☐ Install success rate ≥ 95% in dogfood + closed beta
- ☐ Telemetry opt-out works

### 12.3 Publishing
- ☐ GitHub OAuth signup works
- ☐ Direct web upload publishes a working listing
- ☐ Linter catches missing `name`/`description` in SKILL.md
- ☐ Versioning is immutable
- ☐ `npx datasetai publish` mirrors web publish behavior

### 12.4 Auto-mirror
- ☐ At least 5,000 listings mirrored from approved sources at launch
- ☐ Every mirrored listing shows source attribution + claim CTA
- ☐ Suppression flow tested end-to-end

### 12.5 Trust
- ☐ Verified-publisher application + admin approval flow works
- ☐ Listing report flow works and goes to admin queue
- ☐ License field required and visible

### 12.6 Foundational
- ☐ Privacy policy, ToS, Creator Agreement published
- ☐ DMCA contact and process published
- ☐ Status page live
- ☐ Sentry, PostHog wired

---

## 13. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | **Anthropic launches official Skills marketplace before we get traction** | Medium-High (12–24 months) | High | Position cross-tool from day one; Anthropic's will be Claude-only, so our differentiation survives. Watch Anthropic's roadmap quarterly. |
| R-2 | **OpenAI launches Apps SDK marketplace that captures consumer agent distribution** | High (already underway) | Medium | We are not competing for consumer ChatGPT distribution; we're for builders/devs across tools. Stay lane-focused. |
| R-3 | **Cursor turns cursor.directory into a real registry** | Medium | Medium | Get cross-tool support shipped before they do. Cursor will likely stay Cursor-only; our cross-tool position survives. |
| R-4 | **Linux Foundation / AGENTS.md launches canonical free registry** | Low-Medium | Medium | Their registry will likely be free/non-monetized. Our creator-economy lane survives. We can also be a *paid premium tier* on top of their canonical infra. |
| R-5 | **Auto-mirror creates legal/social backlash** from upstream maintainers | Medium | Medium-High | Pre-launch outreach to top sources (VoltAgent, SkillsMP, prompts.chat); documented suppression flow; respect robots.txt; transparent attribution. |
| R-6 | **No supply-side liquidity at launch** (cold-start problem) | High | High | Auto-mirror seeds ≥10K listings before public launch; founding-creator program recruits 20–50 active publishers pre-launch; concierge onboarding for first 100 claimed creators. |
| R-7 | **Malicious agent gets installed through us** | Medium | High (reputational) | Aggressive content policy + report flow + manual review + blast-radius minimization (we don't run agents, only file-distribution). Phase 3 automated scanning. Blameless post-mortem culture. |
| R-8 | **Format proliferation outpaces our ability to add adapters** | Medium | Medium | Adapter architecture is plugin-based; community PRs encouraged; prioritize formats by adoption stats (MCP and AGENTS.md own ~80% of cross-tool reach). |
| R-9 | **Stripe Connect tax/payout complexity blocks Phase 2 monetization** | Medium | Medium | Start research now; consult with marketplace-experienced fractional ops/finance; consider crypto rails for excluded-country creators. |
| R-10 | **Search quality is poor at launch** (long-tail discoverability) | High | High | Invest in Meilisearch or similar for v1, plus tag/category curation; learn from GPT Store's broken-discovery failure mode. |
| R-11 | **Solo / small team can't ship Phase 1 in 6 months** | Medium | Medium | Scope is intentionally tight (2 formats, basic dashboard, lightweight trust). Consider hiring one senior generalist + one part-time designer. |
| R-12 | **CLI security incident** (compromised npm package) | Low | High | Sign npm publishes (provenance), 2FA on npm account, narrow CLI permissions, no shell-out for installs (file-write only). |

---

## 14. Open Questions (decisions to make before/during implementation)

1. **Flagship format:** Claude Skills vs. MCP — which is the *primary* launch story, with the other as the bundled secondary? Default lean: **Claude Skills** (cleaner artifact, sharper UX); confirm with first 5 founding creators.
2. **Auto-mirror legal/social posture:** how to scrape competitors *welcomely* — outreach plan, attribution wording, suppression SLA.
3. **CLI distribution channel for Phase 2:** `npx`-only, or also Homebrew / Scoop / single-binary release? Default lean: stay `npx`-only at MVP.
4. **Pricing/payment infra (Phase 2):** Stripe Connect is the default; research crypto / platform-wallet rails for countries Stripe excludes (a key creator-pain we attack).
5. **Trust mechanics order:** evals first, or verified-publisher first? Default lean: **verified-publisher first** (cheaper to ship, more visible early signal); evals come Phase 3.
6. **Defensibility cadence:** quarterly recheck of Anthropic / OpenAI / Cursor first-party-registry status; pivot speed plan if any of them ships.
7. **Mirror seed list:** confirm initial ingestion sources and outreach order (lean: VoltAgent first → SkillsMP next → Smithery → prompts.chat → cursor.directory).
8. **Brand positioning:** "npm for agents" is the working tagline — does it still resonate after PRD circulation, or is "GitHub for agents" / "Docker Hub for agents" / "App Store for agents" stronger? Default lean: keep "npm" — it implies install UX.
9. **Pricing for Phase 2 paid tier:** match PromptBase floor at 80% creator share, with founding-creator 90% window — but flat-fee subscriptions vs. per-install vs. hybrid for the *creator-side* premium tier ("Pro publisher: $19/mo for advanced analytics + lower platform fee")? TBD.
10. **Hiring plan for MVP:** solo founder vs. founder + one senior generalist + part-time design? Default lean: founder + one generalist (~6-month runway).

---

## 15. Out-of-MVP Forward Plan (Phase 2 & 3)

### Phase 2 (months 6–12) — *"creator economy & cross-tool"*
- Format expansion: AGENTS.md, `.cursorrules`, Codex skills, Aider, Gemini CLI
- Paid agents: Stripe Connect, payouts, refunds, subscriptions
- Founding-creator program execution (20–50 builders, 90% rev share for 6 months)
- Bundles: agent kits ("Customer Support starter kit")
- Enhanced creator dashboard (revenue, cohort analysis)
- Localization (Russian, Spanish, German, Japanese, Mandarin)

### Phase 3 (year 2+) — *"trust layer & enterprise"*
- Private/team registries
- SSO (SAML, OIDC), audit logs, RBAC
- On-prem / air-gapped deployment
- Automated security scanning (malicious-code detection, prompt injection)
- Sandboxed eval scores (independent agent quality benchmarks)
- API for programmatic install (CI/CD integration)
- Marketplace search SDK (embed in third-party tools)

---

## 16. Appendices

### 16.1 Source documents
- [Product Brief](./product-brief-datasetai-2026-05-02.md)
- [Market Research](./research/market-llm-agent-marketplace-research-2026-05-02.md)

### 16.2 Key external references
- [agents.md (cross-tool standard)](https://agents.md/)
- [VoltAgent / awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — closest direct competitor (free awesome-list, 16.5K stars)
- [Smithery.ai (MCP registry leader)](https://smithery.ai/)
- [PromptBase (creator-economy proof)](https://promptbase.com/)
- [SkillsMP (aggregator)](https://skillsmp.com/)
- [prompts.chat (community OSS)](https://github.com/f/prompts.chat)
- [MCP adoption stats Q2 2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)

### 16.3 Glossary cross-reference
See §5.2 above.

---

_End of PRD v0.1 (yolo draft). Next steps: review, iterate on open questions, run `bmad-validate-prd` for adversarial review, then proceed to `bmad-create-architecture` and `bmad-create-epics-and-stories`._
