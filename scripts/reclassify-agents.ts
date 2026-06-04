#!/usr/bin/env tsx
// scripts/reclassify-agents.ts — update agent categories in Neon using the keyword classifier.
// Usage: pnpm --filter @datasetai/worker exec tsx ../../scripts/reclassify-agents.ts

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../packages/db/src/client.js';
import { agents } from '../packages/db/src/schema.js';
import { eq } from 'drizzle-orm';
import { classifyAgent } from './classify-category.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
const urlMatch = envFile.match(/^DATABASE_URL=(.+)$/m);
const url = urlMatch?.[1];
if (!url) { console.error('No DATABASE_URL in .env'); process.exit(1); }

const { db, close } = createDb({ url, max: 5 });

async function main() {
  console.log('Fetching all agents from Neon...');
  const allAgents = await db.select({ id: agents.id, name: agents.name, description: agents.description, category: agents.category }).from(agents);
  console.log(`Found ${allAgents.length} agents\n`);

  let updated = 0;
  const catCounts = new Map<string, number>();

  for (const a of allAgents) {
    const newCat = classifyAgent(a.name, a.description ?? '');
    catCounts.set(newCat, (catCounts.get(newCat) ?? 0) + 1);

    if (a.category !== newCat) {
      await db.update(agents).set({ category: newCat }).where(eq(agents.id, a.id));
      updated++;
    }
  }

  console.log(`Updated ${updated}/${allAgents.length} agents\n`);
  console.log('📊 Category distribution:');
  for (const [cat, count] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(28)} ${count}`);
  }

  await close();
  console.log('\n✅ Done');
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
