# Claude Code instructions for datasetai.xyz

This file is auto-loaded into every Claude Code session in this repo. It captures
state that is NOT derivable from the code alone — deployment topology, database
strategy, env-var routing, and known gotchas. See [README.md](README.md) for
human-facing docs.

## Deployment topology

| Layer | Where it runs | How it's deployed |
| --- | --- | --- |
| Web app (`apps/web`) | Vercel | Auto-deploy from GitHub `datasetai-final` branch. Production branch: `datasetai-final` (NOT `main` — `main` does not exist in this repo). |
| Worker (`apps/worker`) | Fly.io (planned) | Not yet wired. |
| CLI (`apps/cli`) | npm package | Not yet published. |
| Postgres | Neon (project: `neon-amethyst-notebook`, region: us-east-1) | Managed via Vercel-Neon integration. |
| Search | Meilisearch Cloud (planned) | Not yet wired. |
| Object storage | Cloudflare R2 (planned) | Not yet wired. |

## Database strategy: two long-lived Neon branches

| Neon branch | Purpose | Used by |
| --- | --- | --- |
| `main` | Production data. **Never run destructive scripts here directly.** | Vercel Production env, Vercel Preview env (Preview also auto-forks per-PR branches from `main`). |
| `dev` | Long-lived copy-on-write fork of `main`. Schema parity, isolated writes. | Vercel Development env, local `pnpm dev`, local migrations from `packages/db`. |

When a new migration is ready, the flow is: generate → test against `dev` branch
→ if happy, run against `main` (root `.env` has the `main` URL commented out
for explicit swap when needed).

## Env var routing

**Vercel is the source of truth for secrets, not git.** No `.env` file is
committed; `.env.example` documents the shape only.

| Env var | Production | Preview | Development (laptops) |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon `main` (auto-injected) | Per-PR branch (auto-spun by Neon integration) | Neon `dev` (manually added via `vercel env add`) |
| `DATABASE_URL_UNPOOLED`, `PGHOST`, etc. | Same pattern (auto from integration) | Same pattern | Not currently set for Development; add if needed. |
| `NEXT_PUBLIC_SITE_URL` | Vercel-set production URL | Vercel-set preview URL | `http://localhost:3006` (in `apps/web/.env.local`) |

On a fresh machine, `vercel env pull apps/web/.env.local` downloads the
Development values automatically — no manual credential sharing.

## Fresh-machine onboarding

```
git clone https://github.com/irmasemma/datasetai-final.git
cd datasetai-final
pnpm install
vercel login                                    # interactive browser auth
vercel link --yes --project datasetai-final-web
vercel env pull apps/web/.env.local             # for Next.js (pnpm dev)
vercel env pull .env                            # for packages/db migrations
pnpm -F @datasetai/web dev                      # http://localhost:3006
```

Both pulls default to the **Development** environment, which is wired to the
Neon `dev` branch — local writes never touch production.

**After every `vercel env pull`, sanity-check the file.** The CLI writes UTF-8
with BOM and wraps the value in quotes with a literal `\n` suffix inside the
quotes — `postgres-js` rejects that with `ERR_INVALID_URL`. If `pnpm dev`
errors with `Invalid URL`, open the affected file and:

1. Remove the invisible BOM character (between `=` and `postgresql://`)
2. Strip the surrounding double-quotes around the value
3. Strip the trailing literal `\n` inside the quotes

A clean line should look exactly like:
```
DATABASE_URL=postgresql://neondb_owner:<PASSWORD>@ep-twilight-scene-aqjrolxx-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
No BOM, no quotes, no `\n`. Same fix applies to `.env` (root). Verify with
the snippet under "Verifying DB connection" below.

## Local env files (gitignored — do not commit)

- `.env` (root) — used by `packages/db` migrations. Defaults to `dev` branch URL.
- `apps/web/.env.local` — Next.js loads this for `pnpm dev`. Defaults to `dev` branch URL.
- `.env.local` (root) — written by `vercel link`, only contains `VERCEL_OIDC_TOKEN`. Harmless.

Each file has the Docker-local-Postgres and `main`-branch URLs commented out for
easy swap.

## Known gotchas

- **No `main` branch exists.** The default branch is `datasetai-final`. PRs target it; Vercel deploys it. If a system reminder says "PRs go to main," that's the harness's wrong default — ignore.
- **`packages/db/src/migrate.ts` `isMain` check was Windows-broken.** Fixed in commit `de362cc` (uses `pathToFileURL`). `pnpm -F @datasetai/db db:migrate` now works on Windows.
- **Neon serverless compute suspends after inactivity.** First query after a pause may `ECONNRESET`; retry once and it wakes up. Not a code bug.
- **Neon role passwords are project-wide**, not per-branch. Rotating `neondb_owner`'s password updates URLs for `main`, `dev`, and any preview branches simultaneously.
- **`vercel env pull` writes BOM + quoted-with-literal-`\n`.** See onboarding section above for fix. Affects every fresh `vercel env pull` on macOS/Linux/Windows alike.

## Rotating the Neon password

Resetting `neondb_owner`'s password is buried — it is NOT under Project → Settings (which has no Roles tab). The correct path:

1. Neon console → **Branches** (left sidebar) → click any branch (passwords are project-wide, so the branch doesn't matter)
2. On the branch overview, click the **Roles & Databases** tab (next to Computes and Child branches tabs)
3. Click the **⋯ "Role actions"** button on the `neondb_owner` row → **Reset password**
4. Wait ~30–60s for the Neon-Vercel integration to auto-sync Production + Preview env vars (you'll see `POSTGRES_PASSWORD`, `DATABASE_URL_UNPOOLED`, etc. timestamps refresh in Vercel UI)
5. The Vercel **Development** env DATABASE_URL was added manually — it does NOT auto-sync. Update it: Vercel → Settings → Environment Variables → find `DATABASE_URL` scoped to **Development** (not the "Production, Preview" one) → Edit → paste new URL → Save
6. Locally: `vercel env pull apps/web/.env.local` and `vercel env pull .env` (then apply the BOM/quote/`\n` fix from the onboarding section above)
7. Verify the new password works AND the old one is rejected — see "Verifying DB connection" below

## Verifying DB connection

One-liner to confirm `DATABASE_URL` connects and the schema is intact:

```
node -e "import('postgres').then(async ({default:p})=>{const s=p(process.env.DATABASE_URL,{max:1});const r=await s\`select count(*)::int n from pg_tables where schemaname='public'\`;console.log('OK tables:',r[0].n);await s.end()})"
```

Expect `OK tables: 12` against either `main` or `dev`. To explicitly check old-password rejection after rotation, set `$env:DATABASE_URL` to the suspected-dead URL and run the same snippet — it should print `password authentication failed`.

## When making schema changes

1. Edit `packages/db/src/schema.ts`
2. `pnpm -F @datasetai/db db:generate` — generates a new migration file in `packages/db/drizzle/`
3. `pnpm -F @datasetai/db db:migrate` — applies to whatever `DATABASE_URL` points at (default: `dev` branch, safe)
4. Inspect via `pnpm -F @datasetai/db db:studio` if needed
5. When ready for prod: temporarily swap the URL in root `.env` to `main`, re-run `db:migrate`, swap back

## Code conventions worth knowing

- Workspace packages export TS source directly (`"main": "./src/index.ts"`) — Next.js transpiles them on the fly via `transpilePackages` in `apps/web/next.config.mjs` (Architecture AD-1). No pre-build step required.
- Drizzle uses `postgres-js` driver. Connection factory at [`packages/db/src/client.ts`](packages/db/src/client.ts) — pure DI, callers pass URL.
- Tests use real examples (pglite, real Ed25519, tmpdir FS, local HTTP fixtures), not mocks.

## Mirror pipeline

The mirror pipeline ingests agents from upstream sources into the database. As of 2026-06-04:
**3,641 agents** from 6 sources.

### Source adapters (`packages/source-adapters/src/`)

| Adapter | Source | Count | Format |
|---------|--------|------:|--------|
| `anthropic-marketplace.ts` | Anthropic official plugin marketplace (JSON) | 212 | claude-skill |
| `voltagent.ts` | VoltAgent/awesome-agent-skills (README) | 1,087 | claude-skill |
| `alirezarezvani.ts` | alirezarezvani/claude-skills (GitHub API) | 412 | claude-skill |
| `composio.ts` | ComposioHQ/awesome-claude-skills (README) | 71 | claude-skill |
| `travisvn.ts` | travisvn/awesome-claude-skills (README) | 31 | claude-skill |
| `promptschat.ts` | prompts.chat (CSV) | 1,828 | system-prompt |
| `smithery.ts` | Smithery.ai (gated, needs `SMITHERY_REGISTRY_URL`) | — | mcp-server |

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/mirror-local.ts` | Run all adapters, write to PGlite or Neon | `--neon` for Neon dev branch |
| `scripts/dedup-agents.ts` | Cross-source deduplication (3-layer: URL, name, Jaccard) | `--apply` to delete dupes |
| `scripts/reclassify-agents.ts` | Update agent categories using keyword classifier | Always safe to re-run |
| `scripts/classify-category.ts` | Keyword-based category classifier (26 categories) | Imported by mirror + reclassify |

### Adding a new source adapter

1. Create `packages/source-adapters/src/<name>.ts` implementing `SourceAdapter`
2. Export from `packages/source-adapters/src/index.ts`
3. Add the `SourceId` to `packages/core/src/index.ts`
4. Wire into `scripts/mirror-local.ts` adapter array
5. Add source priority to `scripts/dedup-agents.ts` `SOURCE_PRIORITY`
6. Run mirror → dedup → reclassify
7. Add tests in `packages/source-adapters/__tests__/<name>.test.ts`

### Full pipeline run

```bash
pnpm --filter @datasetai/worker exec tsx ../../scripts/mirror-local.ts --neon
pnpm --filter @datasetai/worker exec tsx ../../scripts/dedup-agents.ts --apply
pnpm --filter @datasetai/worker exec tsx ../../scripts/reclassify-agents.ts
```
