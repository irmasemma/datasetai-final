// scripts/dedup-agents.ts — cross-source deduplication engine.
// Identifies and merges duplicate agents across different mirror sources using
// a 3-layer hybrid approach: sourceUrl match → normalized name match → token Jaccard.
//
// Usage:
//   Dry run:  pnpm --filter @datasetai/worker exec tsx ../../scripts/dedup-agents.ts
//   Apply:    pnpm --filter @datasetai/worker exec tsx ../../scripts/dedup-agents.ts --apply

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../packages/db/src/client.js';
import { agents } from '../packages/db/src/schema.js';
import { eq, inArray } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
const urlMatch = envFile.match(/^DATABASE_URL=(.+)$/m);
const url = urlMatch?.[1];
if (!url) { console.error('No DATABASE_URL in .env'); process.exit(1); }

const APPLY = process.argv.includes('--apply');

// Source priority — lower number = higher priority (wins ties)
const SOURCE_PRIORITY: Record<string, number> = {
  'anthropic-marketplace': 1,
  'voltagent-mirror': 2,
  'composio-mirror': 3,
  'travisvn-mirror': 3,
  'github-mirror': 4,       // alirezarezvani
  'prompts-chat-mirror': 5,
  'smithery-mirror': 6,
};

function sourcePriority(sourceType: string): number {
  return SOURCE_PRIORITY[sourceType] ?? 99;
}

// ─── Normalization helpers ───────────────────────────────────────────────

/** Normalize a URL for comparison: strip protocol, www, trailing slash, .git */
function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  return u
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
}

/** Normalize a name for exact matching: lowercase, strip all non-alphanumeric */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Tokenize a name for Jaccard similarity */
function tokenize(name: string): Set<string> {
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1); // drop single chars
  return new Set(tokens);
}

/** Jaccard similarity between two token sets */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Dedup logic ─────────────────────────────────────────────────────────

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  sourceType: string;
  sourceUrl: string | null;
}

interface DuplicateGroup {
  canonical: AgentRow;       // the one we keep
  duplicates: AgentRow[];    // the ones to remove
  matchType: 'url' | 'name' | 'jaccard';
}

function findDuplicates(allAgents: AgentRow[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const consumed = new Set<string>(); // agent IDs already assigned to a group

  // Sort by priority so highest-priority agents are processed first
  const sorted = [...allAgents].sort(
    (a, b) => sourcePriority(a.sourceType) - sourcePriority(b.sourceType),
  );

  // ─── Layer 1: sourceUrl exact match (cross-source only) ─────────────
  const byUrl = new Map<string, AgentRow[]>();
  for (const a of sorted) {
    const normUrl = normalizeUrl(a.sourceUrl);
    if (!normUrl || normUrl.length < 10) continue; // skip empty/generic URLs
    const existing = byUrl.get(normUrl);
    if (existing) existing.push(a);
    else byUrl.set(normUrl, [a]);
  }

  for (const [, cluster] of byUrl) {
    // Only flag as duplicates if entries come from different sources
    const sources = new Set(cluster.map((a) => a.sourceType));
    if (sources.size < 2) continue; // same source = not cross-source overlap
    if (cluster.length < 2) continue;
    // First one (highest priority) is canonical
    const [canonical, ...dupes] = cluster;
    const realDupes = dupes.filter((d) => !consumed.has(d.id));
    if (realDupes.length === 0) continue;

    groups.push({ canonical, duplicates: realDupes, matchType: 'url' });
    consumed.add(canonical.id);
    for (const d of realDupes) consumed.add(d.id);
  }

  // ─── Layer 2: normalized name exact match ───────────────────────────
  const byName = new Map<string, AgentRow[]>();
  for (const a of sorted) {
    if (consumed.has(a.id)) continue;
    const norm = normalizeName(a.name);
    if (norm.length < 3) continue; // skip very short names
    const existing = byName.get(norm);
    if (existing) existing.push(a);
    else byName.set(norm, [a]);
  }

  for (const [, cluster] of byName) {
    const sources = new Set(cluster.map((a) => a.sourceType));
    if (sources.size < 2) continue; // same source = not cross-source overlap
    if (cluster.length < 2) continue;
    const [canonical, ...dupes] = cluster;
    groups.push({ canonical, duplicates: dupes, matchType: 'name' });
    consumed.add(canonical.id);
    for (const d of dupes) consumed.add(d.id);
  }

  // ─── Layer 3: token Jaccard ≥ 0.85 (only for remaining agents) ─────
  const remaining = sorted.filter((a) => !consumed.has(a.id));
  const tokenized = remaining.map((a) => ({ agent: a, tokens: tokenize(a.name) }));

  for (let i = 0; i < tokenized.length; i++) {
    if (consumed.has(tokenized[i].agent.id)) continue;
    const cluster: AgentRow[] = [tokenized[i].agent];

    for (let j = i + 1; j < tokenized.length; j++) {
      if (consumed.has(tokenized[j].agent.id)) continue;
      if (tokenized[j].agent.sourceType === tokenized[i].agent.sourceType) continue; // cross-source only
      const sim = jaccard(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= 0.85) {
        cluster.push(tokenized[j].agent);
      }
    }

    if (cluster.length < 2) continue;
    // Sort by priority within cluster
    cluster.sort((a, b) => sourcePriority(a.sourceType) - sourcePriority(b.sourceType));
    const [canonical, ...dupes] = cluster;
    groups.push({ canonical, duplicates: dupes, matchType: 'jaccard' });
    consumed.add(canonical.id);
    for (const d of dupes) consumed.add(d.id);
  }

  return groups;
}

// ─── Main ────────────────────────────────────────────────────────────────

const { db, close } = createDb({ url, max: 5 });

async function main() {
  console.log('📊 Cross-source deduplication engine\n');
  console.log(`   Mode: ${APPLY ? '🔴 APPLY (will delete duplicates)' : '🟡 DRY RUN (read-only)'}\n`);

  // Fetch all agents
  const allAgents = await db
    .select({
      id: agents.id,
      name: agents.name,
      description: agents.description,
      sourceType: agents.sourceType,
      sourceUrl: agents.sourceUrl,
    })
    .from(agents);

  console.log(`   Total agents: ${allAgents.length}\n`);

  const groups = findDuplicates(allAgents);

  // Stats
  const byType = { url: 0, name: 0, jaccard: 0 };
  let totalDupes = 0;
  for (const g of groups) {
    byType[g.matchType] += g.duplicates.length;
    totalDupes += g.duplicates.length;
  }

  console.log(`   Duplicate groups found: ${groups.length}`);
  console.log(`   Total duplicates to remove: ${totalDupes}`);
  console.log(`     Layer 1 (URL match):      ${byType.url}`);
  console.log(`     Layer 2 (name match):      ${byType.name}`);
  console.log(`     Layer 3 (Jaccard ≥ 0.85):  ${byType.jaccard}`);
  console.log('');

  // Print sample groups
  const sampleCount = Math.min(groups.length, 15);
  console.log(`   Sample duplicate groups (showing ${sampleCount}/${groups.length}):\n`);
  for (const g of groups.slice(0, sampleCount)) {
    console.log(`   [${g.matchType}] KEEP: ${g.canonical.id} (${g.canonical.sourceType})`);
    for (const d of g.duplicates) {
      console.log(`           DROP: ${d.id} (${d.sourceType})`);
    }
    console.log('');
  }

  if (APPLY && totalDupes > 0) {
    const idsToDelete = groups.flatMap((g) => g.duplicates.map((d) => d.id));
    console.log(`\n🗑️  Deleting ${idsToDelete.length} duplicate agents...`);

    // Delete in batches of 100
    const { agentVersions } = await import('../packages/db/src/schema.js');
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      await db.delete(agentVersions).where(inArray(agentVersions.agentId, batch));
      await db.delete(agents).where(inArray(agents.id, batch));
      process.stdout.write(`   Deleted batch ${Math.floor(i / 100) + 1}/${Math.ceil(idsToDelete.length / 100)}\r`);
    }

    const remaining = await db.select({ id: agents.id }).from(agents);
    console.log(`\n✅ Done — ${idsToDelete.length} duplicates removed. ${remaining.length} agents remain.`);
  } else if (totalDupes === 0) {
    console.log('✅ No duplicates found!');
  } else {
    console.log(`   Run with --apply to delete ${totalDupes} duplicates.`);
  }

  await close();
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
