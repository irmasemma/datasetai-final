// One-shot supply-side measurement.
// Runs each registered source adapter against its live upstream and reports
// the listing count. Lets you size the catalog before flipping the worker on.
//
// Usage: pnpm exec tsx scripts/count-listings.mts

import {
  createAlirezarezvaniAdapter,
  createPromptsChatAdapter,
  createSmitheryAdapter,
  createVoltAgentAdapter,
  type SourceAdapter,
} from '@datasetai/source-adapters';

interface Result {
  id: string;
  label: string;
  count: number;
  ms: number;
  error?: string;
  sample?: string[];
}

async function probe(adapter: SourceAdapter): Promise<Result> {
  const t0 = Date.now();
  let count = 0;
  const sample: string[] = [];
  try {
    for await (const raw of adapter.fetchListings()) {
      count += 1;
      if (sample.length < 3) {
        sample.push(`${raw.upstreamId.slice(0, 60)}`);
      }
    }
  } catch (err) {
    return {
      id: adapter.id,
      label: adapter.label,
      count,
      ms: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  return {
    id: adapter.id,
    label: adapter.label,
    count,
    ms: Date.now() - t0,
    sample,
  };
}

const adapters: SourceAdapter[] = [
  createVoltAgentAdapter(),
  createAlirezarezvaniAdapter(),
  createPromptsChatAdapter(),
  createSmitheryAdapter(),
];

console.log('--- live upstream count ---');
console.log(`node ${process.version}, ${new Date().toISOString()}`);
console.log();

const results = await Promise.all(adapters.map(probe));

let total = 0;
for (const r of results) {
  total += r.count;
  const status = r.error ? `ERROR: ${r.error.slice(0, 80)}` : `${r.count.toLocaleString()} listings`;
  console.log(`  [${r.ms.toString().padStart(5)}ms] ${r.label}`);
  console.log(`    → ${status}`);
  if (r.sample?.length) {
    console.log(`    sample: ${r.sample.join(', ')}`);
  }
  console.log();
}

console.log(`--- total reachable today: ${total.toLocaleString()} ---`);
console.log(`PRD §8.1 target: ≥10,000 mirrored listings before public launch`);
console.log(`gap: ${total >= 10_000 ? `0 — target met` : `${(10_000 - total).toLocaleString()} short`}`);
