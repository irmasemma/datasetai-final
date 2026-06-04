#!/usr/bin/env tsx
// scripts/mirror-local.ts — one-shot mirror run.
// Usage:
//   Local (PGlite):  pnpm --filter @datasetai/worker exec tsx ../../scripts/mirror-local.ts
//   Neon dev branch: pnpm --filter @datasetai/worker exec tsx ../../scripts/mirror-local.ts --neon
//
// --neon reads DATABASE_URL from root .env (Neon dev branch) and writes directly to Postgres.
// Without --neon, uses PGlite locally + exports var/mirror-catalog.json for the fixture loader.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createPgliteDb } from '../packages/db/src/index.js';
import { createDb } from '../packages/db/src/client.js';
import { classifyAgent } from './classify-category.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const PGLITE_DATA_DIR = resolve(REPO_ROOT, 'var/pglite-data');
const CATALOG_JSON_PATH = resolve(REPO_ROOT, 'var/mirror-catalog.json');
import {
  createVoltAgentAdapter,
  createAlirezarezvaniAdapter,
  createPromptsChatAdapter,
  createSmitheryAdapter,
  createAnthropicMarketplaceAdapter,
  createComposioAdapter,
  createTravisvnAdapter,
} from '../packages/source-adapters/src/index.js';
import { refreshMirrors } from '../apps/worker/src/jobs/refresh-mirrors.js';
import * as schema from '../packages/db/src/schema.js';

const USE_NEON = process.argv.includes('--neon');

async function getDbConnection() {
  if (USE_NEON) {
    const envPath = resolve(REPO_ROOT, '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    const urlMatch = envFile.match(/^DATABASE_URL=(.+)$/m);
    const url = urlMatch?.[1];
    if (!url) throw new Error('No DATABASE_URL found in .env — run: vercel env pull .env');
    console.log('\n🚀 datasetai mirror — connecting to Neon dev branch…\n');
    const { db, close } = createDb({ url, max: 5 });
    return { db, close };
  } else {
    console.log('\n🚀 datasetai local mirror — starting PGlite…');
    console.log(`   Data dir: ${PGLITE_DATA_DIR}\n`);
    mkdirSync(PGLITE_DATA_DIR, { recursive: true });
    return await createPgliteDb(PGLITE_DATA_DIR);
  }
}

async function main() {
  const { db, close } = await getDbConnection();

  console.log(USE_NEON ? '✅ Connected to Neon\n' : '✅ PGlite database ready\n');

  // Build adapter list
  const adapters = [
    createAnthropicMarketplaceAdapter(),
    createVoltAgentAdapter(),
    createAlirezarezvaniAdapter(),
    createComposioAdapter(),
    createTravisvnAdapter(),
    createPromptsChatAdapter(),
    ...(process.env['SMITHERY_REGISTRY_URL'] ? [createSmitheryAdapter()] : []),
  ];

  console.log(`📦 Running ${adapters.length} source adapter(s):\n`);
  for (const a of adapters) {
    console.log(`   • ${a.label} (${a.id})`);
  }
  console.log('');

  // Run the mirror pipeline
  const results = await refreshMirrors({
    db,
    adapters,
    contentBaseUrl: 'http://localhost:3000/content',
  });

  // Print results table
  console.log('─'.repeat(90));
  console.log(
    `${'Source'.padEnd(30)} ${'Inserted'.padStart(10)} ${'Updated'.padStart(10)} ${'Skip(lic)'.padStart(10)} ${'Skip(sup)'.padStart(10)} ${'Errors'.padStart(8)}`,
  );
  console.log('─'.repeat(90));

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const r of results) {
    totalInserted += r.inserted;
    totalUpdated += r.updated;
    console.log(
      `${r.source.padEnd(30)} ${String(r.inserted).padStart(10)} ${String(r.updated).padStart(10)} ${String(r.skippedLicense).padStart(10)} ${String(r.skippedSuppressed).padStart(10)} ${String(r.errors.length).padStart(8)}`,
    );
    if (r.errors.length > 0) {
      for (const e of r.errors) {
        console.log(`   ⚠️  ${e}`);
      }
    }
  }

  console.log('─'.repeat(90));
  console.log(
    `${'TOTAL'.padEnd(30)} ${String(totalInserted).padStart(10)} ${String(totalUpdated).padStart(10)}`,
  );
  console.log('');

  // Sample some agents
  const agents = await (db as any).select().from(schema.agents).limit(10);
  if (agents.length > 0) {
    console.log(`📋 Sample agents (first ${agents.length}):\n`);
    for (const a of agents) {
      console.log(`   [${a.sourceType}] ${a.id}`);
      console.log(`     Name: ${a.name}`);
      console.log(`     Format: ${a.primaryFormat} | Tools: ${(a.toolCompatibility ?? []).join(', ')}`);
      console.log(`     License: ${a.license ?? 'unknown'} | Category: ${a.category ?? 'none'}`);
      console.log(`     Source: ${a.sourceUrl ?? '—'}`);
      console.log('');
    }
  }

  // Breakdown
  const allAgents = await (db as any).select().from(schema.agents);
  const bySource = new Map<string, number>();
  const byFormat = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const toolSet = new Map<string, number>();

  for (const a of allAgents) {
    bySource.set(a.sourceType, (bySource.get(a.sourceType) ?? 0) + 1);
    byFormat.set(a.primaryFormat, (byFormat.get(a.primaryFormat) ?? 0) + 1);
    byCategory.set(a.category ?? 'uncategorized', (byCategory.get(a.category ?? 'uncategorized') ?? 0) + 1);
    for (const t of a.toolCompatibility ?? []) {
      toolSet.set(t, (toolSet.get(t) ?? 0) + 1);
    }
  }

  console.log('📊 Breakdown:\n');
  console.log('  By source:');
  for (const [k, v] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(25)} ${v}`);
  }
  console.log('\n  By format:');
  for (const [k, v] of [...byFormat.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(25)} ${v}`);
  }
  console.log('\n  By category:');
  for (const [k, v] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(25)} ${v}`);
  }
  console.log('\n  By tool compatibility:');
  for (const [k, v] of [...toolSet.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(25)} ${v}`);
  }

  // Data quality
  console.log('\n\n🔍 Data quality checks:\n');

  const noDesc = allAgents.filter((a: any) => !a.description || a.description.length < 10);
  console.log(`  Agents with missing/short description: ${noDesc.length}`);

  const noLicense = allAgents.filter((a: any) => !a.license || a.license === 'Unknown');
  console.log(`  Agents with missing/unknown license:   ${noLicense.length}`);

  const noTools = allAgents.filter((a: any) => !a.toolCompatibility || a.toolCompatibility.length === 0);
  console.log(`  Agents with empty toolCompatibility:   ${noTools.length}`);

  const noSource = allAgents.filter((a: any) => !a.sourceUrl);
  console.log(`  Agents with missing sourceUrl:         ${noSource.length}`);

  const withLongDesc = allAgents.filter((a: any) => a.longDescription && a.longDescription.length > 0);
  console.log(`  Agents with longDescription populated: ${withLongDesc.length}/${allAgents.length}`);

  const versions = await (db as any).select().from(schema.agentVersions);
  const zeroSize = versions.filter((v: any) => v.contentSizeBytes === 0);
  console.log(`  AgentVersions with contentSizeBytes=0: ${zeroSize.length}/${versions.length}`);

  // Export JSON catalog for the web app's fixture loader
  const catalog = allAgents.map((a: any) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    primaryFormat: a.primaryFormat,
    formats: a.formats ?? [],
    toolCompatibility: a.toolCompatibility ?? [],
    category: classifyAgent(a.name, a.description ?? ''),
    tags: a.tags ?? [],
    license: a.license ?? null,
    creatorLogin: null,
    sourceType: a.sourceType,
    installCount30d: a.installCount30d ?? 0,
    installCountLifetime: a.installCountLifetime ?? 0,
    updatedAt: (a.updatedAt ?? new Date()).toISOString(),
  }));

  // Print category distribution
  const catCounts = new Map<string, number>();
  for (const c of catalog) {
    catCounts.set(c.category, (catCounts.get(c.category) ?? 0) + 1);
  }
  console.log('\n📊 Category distribution:');
  for (const [cat, count] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(28)} ${count}`);
  }

  if (!USE_NEON) {
    writeFileSync(CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2));
    console.log(`\n📄 Exported ${catalog.length} agents to ${CATALOG_JSON_PATH}`);
  }

  console.log(`\n✅ Done — ${allAgents.length} agents mirrored${USE_NEON ? ' to Neon dev branch' : ''}.`);
  if (!USE_NEON) {
    console.log('   Start the web app with: pnpm dev');
    console.log('   Then visit: http://localhost:3000');
  }
  console.log('');

  await close();
}

main().catch((err) => {
  console.error('❌ Mirror failed:', err);
  process.exit(1);
});
