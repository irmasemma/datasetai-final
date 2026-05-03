// Tests for Story E5.11 — License Preservation.
// Every adapter MUST set `license` on the NormalizedListing — never re-license.
// We test the contract across all currently-shipped adapters.

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  createAlirezarezvaniAdapter,
  createPromptsChatAdapter,
  createSmitheryAdapter,
  createVoltAgentAdapter,
} from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

describe('license preservation across all adapters (Story E5.11)', () => {
  let server: LocalHttpServer;

  beforeAll(async () => {
    const readme = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'voltagent', 'README.md'),
      'utf8',
    );
    const tree = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'alirezarezvani', 'tree.json'),
      'utf8',
    );
    const csv = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'promptschat', 'prompts.csv'),
      'utf8',
    );
    server = await startFixtureServer({
      '/voltagent/README.md': readme,
      '/alirezarezvani/tree.json': {
        status: 200,
        body: tree,
        contentType: 'application/json',
      },
      '/promptschat/prompts.csv': csv,
      '/smithery/registry.json': {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          servers: [
            {
              id: 'unknown-license',
              name: 'Unknown License',
              description: '',
              // Intentionally no license — adapter must mark "Unknown", not invent.
            },
            {
              id: 'gpl-server',
              name: 'GPL Server',
              description: '',
              license: 'GPL-3.0-only',
            },
          ],
        }),
      },
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('every voltagent normalized listing has a non-empty license', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/voltagent/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    for (const i of items) {
      const n = adapter.normalize(i);
      expect(n.license).toBeTruthy();
      expect(n.license.length).toBeGreaterThan(0);
    }
  });

  it('every alirezarezvani normalized listing has a non-empty license', async () => {
    const adapter = createAlirezarezvaniAdapter({
      treeUrl: `${server.url}/alirezarezvani/tree.json`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items.length).toBeGreaterThan(0);
    for (const i of items) {
      const n = adapter.normalize(i);
      expect(n.license).toBeTruthy();
    }
  });

  it('every prompts.chat normalized listing has a non-empty license', async () => {
    const adapter = createPromptsChatAdapter({
      csvUrl: `${server.url}/promptschat/prompts.csv`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    for (const i of items) {
      const n = adapter.normalize(i);
      expect(n.license).toBeTruthy();
    }
  });

  it('Smithery adapter preserves upstream license OR marks as "Unknown" — never invents one', async () => {
    const adapter = createSmitheryAdapter({
      registryUrl: `${server.url}/smithery/registry.json`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const byName = new Map<string, string>(
      items
        .map((i) => adapter.normalize(i))
        .map((n) => [n.name, n.license] as const),
    );
    expect(byName.get('Unknown License')).toMatch(/^Unknown$/);
    expect(byName.get('GPL Server')).toBe('GPL-3.0-only');
  });

  it.todo(
    'denylisted SPDX licenses (e.g. CC-BY-NC) are blocked at ingest — EXPECTS implementer ingest pipeline to apply a denylist',
  );
});
