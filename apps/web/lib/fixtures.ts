// In-memory fixture catalog. Used when DATABASE_URL is absent (local dev / preview).
// Mirrors the shape of @datasetai/db AgentCard so swapping in real DB is mechanical.
//
// When mirrored data exists at ../../var/mirror-catalog.json (written by scripts/mirror-local.ts),
// it is loaded and merged with the hardcoded demo fixtures.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AgentCard } from '@datasetai/db';

export const DEMO_FIXTURES: readonly AgentCard[] = [
  {
    id: 'voltagent/code-reviewer',
    name: 'Code Reviewer',
    description: 'Production-grade code review skill — catches bugs, suggests refactors, scores PRs.',
    primaryFormat: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code'],
    category: 'code-review',
    tags: ['typescript', 'review', 'pr'],
    license: 'MIT',
    creatorLogin: 'voltagent',
    sourceType: 'github-mirror',
    installCount30d: 4280,
    installCountLifetime: 18420,
    updatedAt: new Date('2026-04-22T12:00:00Z'),
  },
  {
    id: 'datasetai/sql-explorer',
    name: 'SQL Explorer',
    description: 'Natural-language SQL companion that introspects your schema and writes safe queries.',
    primaryFormat: 'mcp-server',
    formats: ['mcp-server'],
    toolCompatibility: ['claude-desktop', 'cursor', 'claude-code'],
    category: 'data',
    tags: ['sql', 'database', 'mcp'],
    license: 'Apache-2.0',
    creatorLogin: 'datasetai',
    sourceType: 'direct-publish',
    installCount30d: 3105,
    installCountLifetime: 9211,
    updatedAt: new Date('2026-04-29T08:30:00Z'),
  },
  {
    id: 'smithery/legal-redliner',
    name: 'Legal Redliner',
    description: 'Marks up contract diffs with risk callouts; pairs with your firm’s checklist.',
    primaryFormat: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code'],
    category: 'legal',
    tags: ['contracts', 'redlining'],
    license: 'BSL-1.1',
    creatorLogin: 'smithery',
    sourceType: 'smithery-mirror',
    installCount30d: 1842,
    installCountLifetime: 6710,
    updatedAt: new Date('2026-04-19T17:45:00Z'),
  },
  {
    id: 'datasetai/sales-ops',
    name: 'Sales Ops Companion',
    description: 'Drafts CRM updates, pipeline summaries, and forecast rationales.',
    primaryFormat: 'mcp-server',
    formats: ['mcp-server', 'claude-skill'],
    toolCompatibility: ['claude-desktop', 'cursor'],
    category: 'sales-ops',
    tags: ['sales', 'crm', 'forecasting'],
    license: 'MIT',
    creatorLogin: 'datasetai',
    sourceType: 'direct-publish',
    installCount30d: 980,
    installCountLifetime: 2410,
    updatedAt: new Date('2026-04-28T10:15:00Z'),
  },
  {
    id: 'voltagent/test-author',
    name: 'Test Author',
    description: 'Generates Vitest/Playwright suites for the file you’re editing.',
    primaryFormat: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code', 'cursor'],
    category: 'testing',
    tags: ['testing', 'vitest', 'playwright'],
    license: 'MIT',
    creatorLogin: 'voltagent',
    sourceType: 'github-mirror',
    installCount30d: 2710,
    installCountLifetime: 8820,
    updatedAt: new Date('2026-04-25T14:00:00Z'),
  },
];

function loadMirroredCatalog(): AgentCard[] {
  try {
    // Try multiple resolution strategies (monorepo root vs app root)
    const candidates = [
      resolve(process.cwd(), 'var/mirror-catalog.json'),       // from monorepo root
      resolve(process.cwd(), '../../var/mirror-catalog.json'),  // from apps/web/
    ];
    for (const p of candidates) {
      try {
        const raw = readFileSync(p, 'utf-8');
        const items = JSON.parse(raw) as Array<Record<string, unknown>>;
        console.log(`[fixtures] Loaded ${items.length} mirrored agents from ${p}`);
        return items.map((item) => ({
          ...item,
          updatedAt: new Date(item['updatedAt'] as string),
        })) as unknown as AgentCard[];
      } catch { /* try next */ }
    }
    return [];
  } catch {
    return [];
  }
}

const mirrored = loadMirroredCatalog();

// Deduplicate: mirrored agents with IDs matching demo fixtures are skipped
const demoIds = new Set(DEMO_FIXTURES.map((d) => d.id));
const dedupedMirrored = mirrored.filter((m) => !demoIds.has(m.id));

export const FIXTURE_CATALOG: readonly AgentCard[] =
  dedupedMirrored.length > 0 ? [...DEMO_FIXTURES, ...dedupedMirrored] : DEMO_FIXTURES;

export interface FixtureCreator {
  readonly username: string;
  readonly displayName: string;
  readonly bio: string;
  readonly isVerifiedPublisher: boolean;
}

export const FIXTURE_CREATORS: Readonly<Record<string, FixtureCreator>> = {
  voltagent: {
    username: 'voltagent',
    displayName: 'VoltAgent',
    bio: 'Open-source AI agent collective focused on developer tooling.',
    isVerifiedPublisher: true,
  },
  datasetai: {
    username: 'datasetai',
    displayName: 'datasetai',
    bio: 'First-party agents from datasetai.xyz.',
    isVerifiedPublisher: true,
  },
  smithery: {
    username: 'smithery',
    displayName: 'Smithery',
    bio: 'Curating the best agents in the wild.',
    isVerifiedPublisher: false,
  },
};
