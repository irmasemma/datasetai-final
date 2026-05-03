// Tests for Story E5.6 — Mirror Source: prompts.chat.
// Real local HTTP server returning a fixture CSV. Adapter parses CSV, normalizes.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createPromptsChatAdapter, parseCsv } from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

const FIXTURE_CSV_PATH = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'promptschat',
  'prompts.csv',
);

describe('prompts.chat source adapter (Story E5.6)', () => {
  let server: LocalHttpServer;
  let csv: string;

  beforeAll(async () => {
    csv = await fs.readFile(FIXTURE_CSV_PATH, 'utf8');
    server = await startFixtureServer({
      '/prompts.csv': { status: 200, body: csv, contentType: 'text/csv' },
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('parseCsv reads multi-row quoted CSV correctly', () => {
    const rows = parseCsv(csv);
    expect(rows.length).toBeGreaterThanOrEqual(5);
    const acts = rows.map((r) => r.act);
    expect(acts).toContain('Linux Terminal');
    expect(acts).toContain('JavaScript Console');
    expect(rows[0]!.prompt).toMatch(/linux terminal/i);
  });

  it('fetchListings() yields one RawListing per CSV row', async () => {
    const adapter = createPromptsChatAdapter({
      csvUrl: `${server.url}/prompts.csv`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items[0]!.source).toBe('prompts-chat-mirror');
  });

  it('normalize() emits system-prompt format with prompts-chat/<slug> id', async () => {
    const adapter = createPromptsChatAdapter({
      csvUrl: `${server.url}/prompts.csv`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const normalized = adapter.normalize(items[0]!);
    expect(normalized.primaryFormat).toBe('system-prompt');
    expect(normalized.id).toMatch(/^prompts-chat\//);
    expect(normalized.sourceType).toBe('prompts-chat-mirror');
    // license preserved as CC0-1.0 per implementer's adapter.
    expect(normalized.license).toBeDefined();
  });
});
