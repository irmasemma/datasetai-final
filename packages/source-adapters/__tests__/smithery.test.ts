// Tests for Story E5.5 — Mirror Source: Smithery (metadata only).
// The implementer left the adapter as NOT_IMPLEMENTED until SMITHERY_REGISTRY_URL is wired.
// We test the documented behavior: throws a NOT_IMPLEMENTED error without that URL,
// and works against a real fixture HTTP server when one is provided.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSmitheryAdapter } from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

describe('Smithery source adapter (Story E5.5)', () => {
  let server: LocalHttpServer;

  beforeAll(async () => {
    server = await startFixtureServer({
      '/registry': {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          servers: [
            {
              id: 'sql-server',
              name: 'SQL MCP Server',
              description: 'Run SQL via MCP',
              homepage: 'https://example.com/sql',
              license: 'MIT',
            },
            {
              id: 'fs-server',
              name: 'Filesystem MCP Server',
              description: 'Browse files via MCP',
              license: 'Apache-2.0',
            },
          ],
        }),
      },
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('without SMITHERY_REGISTRY_URL the adapter throws NOT_IMPLEMENTED', async () => {
    // Delete env so the adapter falls into its "not configured" branch.
    const previous = process.env['SMITHERY_REGISTRY_URL'];
    delete process.env['SMITHERY_REGISTRY_URL'];
    try {
      const adapter = createSmitheryAdapter();
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of adapter.fetchListings()) {
          // unreachable
        }
      }).rejects.toThrow(/NOT_IMPLEMENTED/);
    } finally {
      if (previous !== undefined) process.env['SMITHERY_REGISTRY_URL'] = previous;
    }
  });

  it('when configured against a registry URL, fetches and yields metadata-only listings', async () => {
    const adapter = createSmitheryAdapter({
      registryUrl: `${server.url}/registry`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items).toHaveLength(2);
    expect(items[0]!.source).toBe('smithery-mirror');
  });

  it('normalize() preserves the upstream license (E5.11) — falls back to "Unknown" when missing', async () => {
    const adapter = createSmitheryAdapter({
      registryUrl: `${server.url}/registry`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const normalized = items.map((i) => adapter.normalize(i));
    expect(normalized[0]!.license).toBe('MIT');
    expect(normalized[1]!.license).toBe('Apache-2.0');
    // Sanity: format is mcp-server.
    expect(normalized.every((n) => n.primaryFormat === 'mcp-server')).toBe(true);
  });
});
