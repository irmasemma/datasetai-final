// Tests for Story E2.3 — Search.
// We test the data-layer searchAgents fallback (which uses fixtures when no DB).
// The /search route page is todo until it lands.

import { describe, expect, it } from 'vitest';
import { searchAgents } from '../lib/catalog.js';

describe('search data layer (Story E2.3)', () => {
  it('finds the SQL Explorer agent with query "SQL"', async () => {
    const results = await searchAgents('SQL');
    expect(results.some((r) => r.id === 'datasetai/sql-explorer')).toBe(true);
  });

  it('returns zero results for a no-match query', async () => {
    const results = await searchAgents('xyzzyplugh-no-match');
    expect(results).toEqual([]);
  });

  it('respects format filter', async () => {
    const results = await searchAgents('agent', { format: 'mcp-server' });
    expect(results.every((r) => r.formats.includes('mcp-server') || r.primaryFormat === 'mcp-server')).toBe(true);
  });
});

describe('search route (Story E2.3)', () => {
  it.todo(
    'GET /search?q=… renders typo-tolerant Meilisearch results — EXPECTS apps/web/app/search/page.tsx to land + Meilisearch wired',
  );
  it.todo('zero-state UI renders when the query has no matches — EXPECTS search route landing');
});
