# Development Log — datasetai.xyz

> Living document for agents and contributors to understand what's been done, what's working, and what's next.
> Updated: 2026-05-29

---

## Session: 2026-05-29 — Local Mirror Pipeline Setup & Fixes

### What was done

#### 1. Local dev environment verified
- Node 22.14.0, pnpm 10.10.0 installed via corepack
- `pnpm install` — 504 packages, all clean
- `pnpm dev` — all 3 apps boot successfully:
  - **web** (Next.js 15) on http://localhost:3000
  - **worker** (BullMQ tsx watch) — runs in-process
  - **cli** (tsx watch) — commands: install, search, list, uninstall
- **All 196 tests pass** (42 test files, 31 todo-marked tests for future work)

#### 2. Mirror pipeline audit — gaps identified and fixed

**Bug: `refresh-mirrors.ts` update path was incomplete**
- On re-mirror (agent already exists), only `name`, `description`, `tags`, `license`, `category` were updated
- **Missing from update:** `longDescription`, `formats`, `toolCompatibility`, `primaryFormat`, `sourceUrl`, `sourceAttribution`
- **Fix:** Added all missing fields to the `.set()` clause in the update branch

**Bug: `toolCompatibility` was wrong or incomplete in 3 of 4 adapters**

| Adapter | Before | After | Rationale |
|---------|--------|-------|-----------|
| alirezarezvani | `['claude-code']` | `['claude-code', 'openai-codex', 'cursor', 'gemini-cli', 'aider']` | Repo README explicitly lists multi-tool support |
| VoltAgent | `['claude-code']` | `['claude-code', 'cursor', 'aider']` | Cross-tool skill collection |
| prompts.chat | `[]` (empty) | `['claude-code', 'chatgpt', 'cursor', 'gemini-cli']` | System prompts are tool-agnostic |
| Smithery | `['claude-desktop', 'cursor']` | *(unchanged — already correct for MCP servers)* | — |

#### 3. Local mirror script created (`scripts/mirror-local.ts`)

A standalone script that runs the full mirror pipeline against an in-memory PGlite database — no external Postgres needed.

**Run with:**
```bash
pnpm --filter @datasetai/worker exec tsx ../../scripts/mirror-local.ts
```

**What it does:**
1. Boots PGlite in-memory with full schema (using `tests/helpers/pg-bootstrap.ts`)
2. Runs all available source adapters (VoltAgent, alirezarezvani, prompts.chat; Smithery if `SMITHERY_REGISTRY_URL` set)
3. Calls `refreshMirrors()` — the real production pipeline, not a mock
4. Prints: results table, sample agents, breakdown by source/format/category/tool, data quality checks

**Results from first run (2026-05-29):**

| Source | Inserted | Notes |
|--------|----------|-------|
| prompts.chat | 1,826 | System prompts from awesome-chatgpt-prompts |
| alirezarezvani | 415 | Claude skills from alirezarezvani/claude-skills repo |
| VoltAgent | 2 | Only 2 linked repos in README (not skills themselves) |
| **Total** | **2,243** | |

**Data quality:**
- 0 agents with missing/short descriptions ✅
- 0 agents with missing licenses ✅
- 0 agents with empty toolCompatibility ✅ (was broken before fix)
- 1,826/2,243 have `longDescription` populated (prompts.chat provides full prompt text)
- `contentSizeBytes` is always 0 — no actual content download/storage yet (known limitation)

#### 4. Files changed

| File | Change |
|------|--------|
| `apps/worker/src/jobs/refresh-mirrors.ts` | Fixed incomplete update clause — added longDescription, formats, toolCompatibility, primaryFormat, sourceUrl, sourceAttribution |
| `packages/source-adapters/src/voltagent.ts` | toolCompatibility: `['claude-code']` → `['claude-code', 'cursor', 'aider']` |
| `packages/source-adapters/src/alirezarezvani.ts` | toolCompatibility: `['claude-code']` → `['claude-code', 'openai-codex', 'cursor', 'gemini-cli', 'aider']` |
| `packages/source-adapters/src/promptschat.ts` | toolCompatibility: `[]` → `['claude-code', 'chatgpt', 'cursor', 'gemini-cli']` |
| `scripts/mirror-local.ts` | **New** — standalone local mirror runner using PGlite |

---

## Known Issues & Remaining Gaps

### Mirror pipeline
- **`contentSizeBytes` always 0** — `agentVersions` insert hardcodes `contentSizeBytes: 0` because no actual content is downloaded/stored during mirroring. Content is metadata-only for now.
- **VoltAgent adapter only yields 2 results** — it parses README bullet links, but the current VoltAgent README structure may have changed or only has 2 top-level linked repos. May need to recurse into linked repos or adapt to their current README format.
- **Smithery adapter is gated** — requires `SMITHERY_REGISTRY_URL` env var. The public API is not yet finalized upstream.
- **Categories are generic** — all adapters use hardcoded categories (`mirrored`, `prompt`, `mcp`). Richer categorization would require parsing skill content or metadata.
- **Tags are generic** — `['voltagent', 'mirror']`, `['claude-skill', 'mirror']`, etc. Could extract more meaningful tags from upstream content.

### Missing Tier-1 mirror sources (from supply-bootstrap-plan)
The plan calls for ~10K listings at launch. Currently we have 3 adapters covering:
- ✅ VoltAgent/awesome-agent-skills (Tier 1) — but low yield
- ✅ alirezarezvani/claude-skills (Tier 1) — 415 skills
- ✅ prompts.chat (not in plan, bonus source) — 1,826 prompts
- ⬜ Smithery (Tier 3) — adapter exists but gated
- ⬜ **Superpowers** (94K ⭐) — no adapter yet
- ⬜ **Everything Claude Code (ECC)** (100K+ ⭐) — no adapter yet
- ⬜ travisvn/awesome-claude-skills — no adapter yet
- ⬜ ComposioHQ/awesome-claude-skills — no adapter yet
- ⬜ daymade/claude-code-skills (Tier 2) — no adapter yet
- ⬜ Glama.ai, PulseMCP, MCP.so (Tier 3 MCP registries) — no adapter yet

### Schema / data model
- `agents.creatorId` is never set for mirrored agents (OK — no user account for mirrors)
- `agents.searchRank` stays at default 0 for all mirrored agents — needs a ranking pass
- `agentVersions.changelog` is never set for mirrored agents

---

## Architecture Notes for Future Agents

### How mirroring works
1. **Source adapters** (`packages/source-adapters/src/`) implement the `SourceAdapter` interface:
   - `fetchListings()` — async generator yielding `RawListing` from upstream
   - `normalize(raw)` — converts raw data to `NormalizedListing` (our canonical shape)
2. **`refreshMirrors()`** (`apps/worker/src/jobs/refresh-mirrors.ts`) orchestrates:
   - Iterates each adapter
   - License check via `isMirrorAllowedLicense()` — skips proprietary
   - Suppression check via `isAgentSuppressed()` — skips suppressed agents
   - Upserts into `agents` + `agentVersions` tables
3. **Worker cron** fires `refresh-mirrors` every 6h (configurable via `WORKER_REFRESH_INTERVAL_MS`)

### Adding a new source adapter
1. Create `packages/source-adapters/src/<name>.ts`
2. Implement `SourceAdapter` — see `voltagent.ts` or `alirezarezvani.ts` as templates
3. Export from `packages/source-adapters/src/index.ts`
4. Wire into `apps/worker/src/index.ts` adapter array
5. Add tests in `packages/source-adapters/__tests__/<name>.test.ts`
6. Run `scripts/mirror-local.ts` to validate

### Key types
- `SourceAdapter` — `packages/source-adapters/src/types.ts`
- `NormalizedListing` — same file, the canonical shape adapters must produce
- `NewAgent` / `NewAgentVersion` — `packages/db/src/schema.ts` (Drizzle inferred insert types)
- `FormatId` / `SourceId` / `ToolId` — `packages/core/src/index.ts`

### Database
- Full schema: `packages/db/src/schema.ts` (Drizzle ORM)
- Test bootstrap SQL: `tests/helpers/pg-bootstrap.ts` (PGlite-compatible DDL)
- Queries/helpers: `packages/db/src/queries.ts` (catalog, search, metrics, moderation)

---

## Session: 2026-05-29 (cont.) — Mirrored Data on localhost

### Problem
After running `scripts/mirror-local.ts`, the web app on localhost:3000 still showed only 5 hardcoded demo fixtures. The mirrored 2,245 agents were only in PGlite's on-disk format, which the web app couldn't read.

### Approaches tried

#### ❌ PGlite inside Next.js (failed)
- Created `packages/db/src/pglite-client.ts` — async PGlite client with persistent storage
- Updated `apps/web/lib/db.ts` and `catalog.ts` for async DB access
- Added `serverExternalPackages: ['@electric-sql/pglite']` to `next.config.mjs`
- **Failed**: PGlite uses WASM + `ArrayBuffer.transfer()` which RSC serialization can't handle. citext WASM extension also can't be resolved by webpack. **PGlite cannot run inside Next.js server components.**
- All web app changes reverted.

#### ✅ JSON export + fixture loading (working)
- Updated `scripts/mirror-local.ts` to export `var/mirror-catalog.json` (AgentCard-shaped JSON)
- Updated `apps/web/lib/fixtures.ts` to load and merge mirrored data from that JSON file
- The existing fixture fallback in `catalog.ts` handles search, filter, sort, pagination — no changes needed there

### What changed

| File | Change |
|------|--------|
| `scripts/mirror-local.ts` | Added JSON export step after DB mirror — writes `var/mirror-catalog.json` |
| `apps/web/lib/fixtures.ts` | Added `loadMirroredCatalog()` that reads JSON, merges with demo fixtures, deduplicates by ID |
| `apps/web/next.config.mjs` | Removed unnecessary `serverExternalPackages` (PGlite not used in web app) |
| `apps/web/__tests__/catalog.test.tsx` | Uses `DEMO_FIXTURES` for deterministic grid tests (mirrored data has duplicate names) |

### How to use

```bash
# 1. Run the mirror script (fetches from upstream sources, classifies, writes JSON)
pnpm --filter @datasetai/worker exec tsx ../../scripts/mirror-local.ts

# 2. Start the dev server
pnpm dev

# 3. Visit http://localhost:3000 — 3,369 agents visible (5 demo + 3,364 mirrored)
```

### Result
- **3,369 agents** visible on localhost:3000 (5 demo fixtures + 3,364 mirrored)
- All 196 tests pass
- No external database required
- JSON file at `var/mirror-catalog.json` is gitignored (regenerated on demand)

### Key gotcha: PGlite + Next.js
**Do not attempt to use PGlite inside Next.js server components.** WASM ArrayBuffer serialization is incompatible with RSC. Use PGlite only in standalone scripts or test environments.

---

## Session: 2026-06-02 — VoltAgent fix + Category Classifier

### VoltAgent adapter regex fix
The VoltAgent adapter (`packages/source-adapters/src/voltagent.ts`) was only yielding 2 agents despite the upstream README having **1,400+ entries**. The issue: the README uses bold-link format `- **[name](url)** - desc` but the regex only matched plain `- [name](url) desc`.

**Fix:** Updated `ENTRY_LINE` regex to handle optional `**` wrapping:
```
Before: /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-—:]?\s*(.*)$/
After:  /^[-*]\s+\*{0,2}\[([^\]]+)\]\(([^)]+)\)\*{0,2}\s*[-—:]?\s*(.*)$/
```
Result: VoltAgent now yields **1,112 agents** (up from 2).

### Category classifier
Created `scripts/classify-category.ts` — keyword-based classifier that assigns one of 26 meaningful categories to each agent based on name + description matching. Categories include:

| Category | Example keywords |
|----------|-----------------|
| Frontend Development | react, vue, angular, tailwind, css |
| Backend & APIs | api, rest, graphql, express, middleware |
| Security | vulnerability, owasp, encrypt, auth |
| AI & Agent Building | agent, llm, gpt, claude, mcp |
| DevOps & CI/CD | docker, kubernetes, terraform, deploy |
| Cloud & Infrastructure | aws, azure, cloudflare, serverless |
| Testing & QA | test, vitest, playwright, e2e |
| ... | (26 categories total) |

The classifier runs during JSON export in `mirror-local.ts`, replacing the generic `prompt`/`mirrored` labels.

### Files changed
| File | Change |
|------|--------|
| `packages/source-adapters/src/voltagent.ts` | Fixed ENTRY_LINE regex for bold-link format |
| `scripts/classify-category.ts` | **New** — keyword-based category classifier |
| `scripts/mirror-local.ts` | Imports classifier, prints category distribution |

### Current mirror totals

| Source | Count |
|--------|------:|
| prompts.chat | 1,834 |
| VoltAgent/awesome-agent-skills | 1,112 |
| alirezarezvani/claude-skills | 418 |
| **Total** | **3,364** |

### Adding a new category
Edit `scripts/classify-category.ts`:
1. Add the category name to the `CATEGORIES` array
2. Add a `Rule` entry with a regex and weight (higher weight = higher priority)
3. Re-run `scripts/mirror-local.ts` to reclassify

### Next steps for future agents
- **More source adapters needed** to reach 10K target (see supply-bootstrap-plan)
- **Smithery adapter** exists but needs `SMITHERY_REGISTRY_URL` env var
- **Missing adapters:** Superpowers (94K⭐), Everything Claude Code (100K+⭐), travisvn, ComposioHQ, daymade, Glama.ai, PulseMCP, MCP.so
- **Category refinement:** classifier uses keyword heuristics — consider LLM-based classification for better accuracy
- **Agent descriptions:** alirezarezvani entries have generic "Mirrored Claude skill from..." descriptions — could fetch actual README content
- **Install counts:** all mirrored agents have 0 installs — need a popularity signal (GitHub stars, npm downloads)
