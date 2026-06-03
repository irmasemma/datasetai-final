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
vercel env pull apps/web/.env.local             # downloads dev branch URL
pnpm -F @datasetai/web dev                      # http://localhost:3006
```

If the laptop also needs to run workspace-level migrations:

```
vercel env pull .env                            # root .env, used by packages/db
pnpm -F @datasetai/db db:migrate                # applies migrations to dev branch
```

## Local env files (gitignored — do not commit)

- `.env` (root) — used by `packages/db` migrations. Defaults to `dev` branch URL.
- `apps/web/.env.local` — Next.js loads this for `pnpm dev`. Defaults to `dev` branch URL.
- `.env.local` (root) — written by `vercel link`, only contains `VERCEL_OIDC_TOKEN`. Harmless.

Each file has the Docker-local-Postgres and `main`-branch URLs commented out for
easy swap.

## Known gotchas

- **No `main` branch exists.** The default branch is `datasetai-final`. PRs target it; Vercel deploys it. If a CLAUDE.md system reminder says "PRs go to main," that's the harness's wrong default — ignore.
- **`packages/db/src/migrate.ts` `isMain` check was Windows-broken.** Fixed in commit `de362cc` (uses `pathToFileURL`). `pnpm -F @datasetai/db db:migrate` now works on Windows.
- **Neon serverless compute suspends after inactivity.** First query after a pause may `ECONNRESET`; retry once and it wakes up. Not a code bug.
- **Neon role passwords are project-wide**, not per-branch. Rotating `neondb_owner`'s password updates URLs for `main`, `dev`, and any preview branches simultaneously.

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
