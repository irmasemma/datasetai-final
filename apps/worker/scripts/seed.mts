// One-shot seed against an in-memory pglite database.
//
// Spins up an embedded Postgres (no Docker, no real DB needed), creates the
// minimum schema the mirror pipeline writes to, runs every registered adapter
// against its live upstream, and reports per-source counts.
//
// Output:
//   - per-source insert counts (the actual mirror result)
//   - sample rows for inspection
//   - optional SQL dump at apps/worker/scripts/seed.sql for replay against
//     real Postgres later
//
// Usage:
//   pnpm exec tsx apps/worker/scripts/seed.mts            # seed in memory
//   pnpm exec tsx apps/worker/scripts/seed.mts --dump     # also write seed.sql
//
// This is the metadata-only mirror: we store source_url + content_hash, never
// the upstream file bytes.

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import {
  createAlirezarezvaniAdapter,
  createPromptsChatAdapter,
  createSmitheryAdapter,
  createVoltAgentAdapter,
} from '@datasetai/source-adapters';
import { agents, createDb, type Database } from '@datasetai/db';
import { refreshMirrors } from '../src/jobs/refresh-mirrors.js';

// ---- pglite-friendly schema -------------------------------------------------
//
// Real Postgres migrations create ~14 tables incl. citext-typed columns. pglite
// doesn't ship citext. For this seed we only need the 3 tables refreshMirrors
// touches: agents, agent_versions, suppressions. Everything else stays empty.

const SCHEMA_SQL = `
CREATE TABLE agents (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  long_description text,
  category text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  primary_format text NOT NULL,
  formats text[] NOT NULL DEFAULT '{}'::text[],
  tool_compatibility text[] NOT NULL DEFAULT '{}'::text[],
  license text,
  source_type text NOT NULL,
  source_url text,
  source_attribution jsonb,
  creator_id uuid,
  current_version text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  unpublished_at timestamp with time zone,
  install_count_lifetime bigint NOT NULL DEFAULT 0,
  install_count_30d bigint NOT NULL DEFAULT 0,
  search_rank real NOT NULL DEFAULT 0,
  upstream_stars integer,
  upstream_stars_synced_at timestamp with time zone,
  rating_avg real,
  rating_count integer NOT NULL DEFAULT 0
);

CREATE TABLE agent_versions (
  agent_id text NOT NULL,
  version text NOT NULL,
  content_hash text NOT NULL,
  content_size_bytes bigint NOT NULL,
  manifest_url text NOT NULL,
  content_url text NOT NULL,
  changelog text,
  format text NOT NULL,
  price_cents integer,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  unpublished_at timestamp with time zone,
  PRIMARY KEY (agent_id, version)
);

CREATE TABLE suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  source_type text,
  source_url text,
  agent_id text,
  creator_id uuid,
  reason text NOT NULL,
  requested_by text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

CREATE INDEX agents_search_rank_idx ON agents (search_rank);
CREATE INDEX agents_source_idx ON agents (source_type, source_url);
CREATE INDEX agents_category_idx ON agents (category);
`;

async function main(): Promise<void> {
  const dump = process.argv.includes('--dump');
  const databaseUrl = process.env['DATABASE_URL'];
  const t0 = Date.now();

  let db: Database;
  let close: () => Promise<void>;

  if (databaseUrl) {
    console.log('--- datasetai.xyz seed (real Postgres via DATABASE_URL) ---');
    const created = createDb({ url: databaseUrl });
    db = created.db;
    close = created.close;
  } else {
    console.log('--- datasetai.xyz seed (pglite, in-memory) ---');
    const pg = new PGlite();
    await pg.exec(SCHEMA_SQL);
    db = drizzlePglite(pg) as unknown as Database;
    close = async () => {
      await pg.close();
    };
  }
  console.log(`node ${process.version}, ${new Date().toISOString()}`);
  console.log();

  console.log('Running mirror pipeline against live upstreams…');
  console.log();

  const results = await refreshMirrors({
    db,
    adapters: [
      createVoltAgentAdapter(),
      createAlirezarezvaniAdapter(),
      createPromptsChatAdapter(),
      ...(process.env['SMITHERY_REGISTRY_URL'] ? [createSmitheryAdapter()] : []),
    ],
    contentBaseUrl: 'https://datasetai.xyz',
  });

  let totalInserted = 0;
  for (const r of results) {
    totalInserted += r.inserted;
    const errBit = r.errors.length ? `, errors=${r.errors.length}` : '';
    console.log(
      `  [${r.source.padEnd(22)}] inserted=${String(r.inserted).padStart(5)}  ` +
        `updated=${String(r.updated).padStart(4)}  skip-license=${r.skippedLicense}  ` +
        `skip-suppressed=${r.skippedSuppressed}${errBit}`,
    );
    for (const err of r.errors) {
      console.log(`      ! ${err.slice(0, 120)}`);
    }
  }

  console.log();
  console.log(`--- inserted ${totalInserted.toLocaleString()} agents in ${Date.now() - t0}ms ---`);

  // Sample rows for sanity.
  const sample = await db
    .select({
      id: agents.id,
      name: agents.name,
      sourceType: agents.sourceType,
      license: agents.license,
      tags: agents.tags,
    })
    .from(agents)
    .limit(5);
  console.log();
  console.log('Sample rows:');
  for (const row of sample) {
    console.log(
      `  ${row.id.padEnd(54)}  [${row.sourceType.padEnd(18)}]  ${row.license ?? '—'}  ${row.name}`,
    );
  }

  if (dump) {
    const dumpPath = join(process.cwd(), 'apps', 'worker', 'scripts', 'seed.sql');
    const all = await db.select().from(agents);
    const lines: string[] = [
      '-- datasetai.xyz mirror seed dump',
      `-- generated ${new Date().toISOString()} from in-memory pglite seed`,
      `-- ${all.length.toLocaleString()} agents, metadata-only (content_url points at upstream)`,
      '',
    ];
    for (const a of all) {
      const tags = `ARRAY[${a.tags.map(escapeSqlString).join(',')}]::text[]`;
      const formats = `ARRAY[${a.formats.map(escapeSqlString).join(',')}]::text[]`;
      const tools = `ARRAY[${a.toolCompatibility.map(escapeSqlString).join(',')}]::text[]`;
      const attr = a.sourceAttribution
        ? `'${JSON.stringify(a.sourceAttribution).replace(/'/g, "''")}'::jsonb`
        : 'NULL';
      lines.push(
        `INSERT INTO agents (id,name,description,category,tags,primary_format,formats,tool_compatibility,license,source_type,source_url,source_attribution,current_version) VALUES (` +
          `${escapeSqlString(a.id)},${escapeSqlString(a.name)},${escapeSqlString(a.description)},` +
          `${a.category ? escapeSqlString(a.category) : 'NULL'},${tags},` +
          `${escapeSqlString(a.primaryFormat)},${formats},${tools},` +
          `${a.license ? escapeSqlString(a.license) : 'NULL'},` +
          `${escapeSqlString(a.sourceType)},${a.sourceUrl ? escapeSqlString(a.sourceUrl) : 'NULL'},` +
          `${attr},${escapeSqlString(a.currentVersion)});`,
      );
    }
    await writeFile(dumpPath, lines.join('\n'), 'utf8');
    console.log();
    console.log(`Dump written → ${dumpPath} (${lines.length - 4} INSERTs)`);
  }

  await close();
}

function escapeSqlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

await main();
