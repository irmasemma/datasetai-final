// Tests for Story E5.3 — Mirror Source: VoltAgent / awesome-agent-skills.
// Real local HTTP server with a fixture README. The adapter calls fetchFn against
// our fixture URL, parses the markdown list, and yields RawListings that
// normalize() turns into row-ready NormalizedListings. No mocks of internal modules.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createVoltAgentAdapter, parseVoltAgentReadme } from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

const FIXTURE_README_PATH = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'voltagent',
  'README.md',
);

describe('VoltAgent source adapter (Story E5.3)', () => {
  let server: LocalHttpServer;
  let readme: string;

  beforeAll(async () => {
    readme = await fs.readFile(FIXTURE_README_PATH, 'utf8');
    server = await startFixtureServer({ '/README.md': readme });
  });

  afterAll(async () => {
    await server.close();
  });

  it('parseVoltAgentReadme picks every well-formed bullet entry from the fixture', () => {
    const entries = parseVoltAgentReadme(readme);
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const names = entries.map((e) => e.name);
    expect(names).toContain('Code Reviewer');
    expect(names).toContain('Test Author');
    // URLs are http(s).
    expect(entries.every((e) => /^https?:\/\//.test(e.url))).toBe(true);
  });

  it('fetchListings() yields RawListings with source="voltagent-mirror"', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items[0]!.source).toBe('voltagent-mirror');
    expect(items[0]!.upstreamUrl).toMatch(/^https:\/\/github\.com\/voltagent\//);
  });

  it('normalize() produces a row-ready NormalizedListing with attribution', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const normalized = adapter.normalize(items[0]!);
    expect(normalized.id).toMatch(/^voltagent\//);
    expect(normalized.primaryFormat).toBe('claude-skill');
    expect(normalized.sourceType).toBe('voltagent-mirror');
    expect(normalized.sourceUrl).toMatch(/^https?:\/\//);
    expect(normalized.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(normalized.authorHandle).toBeDefined();
  });

  it('content hash is deterministic across re-runs (E5.3 dedup invariant)', async () => {
    const adapter1 = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const adapter2 = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items1 = [];
    for await (const i of adapter1.fetchListings()) items1.push(i);
    const items2 = [];
    for await (const i of adapter2.fetchListings()) items2.push(i);
    expect(adapter1.normalize(items1[0]!).contentHash).toBe(
      adapter2.normalize(items2[0]!).contentHash,
    );
  });

  it('fetch failure surfaces a clear error message', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/does-not-exist`,
      fetch: globalThis.fetch as never,
    });
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of adapter.fetchListings()) {
        // unreachable
      }
    }).rejects.toThrow(/HTTP\s+404/);
  });
});
