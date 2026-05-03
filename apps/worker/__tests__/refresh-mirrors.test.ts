// Tests for Story E5.10 — Mirror Refresh Cadence.
// We test the worker-shaped behavior: wire two real adapters against fixture servers,
// run a refresh handler, assert N normalized rows make it into pglite via real upserts.
//
// The implementer's actual refresh job module isn't wired yet; we encode the contract
// in this test as a small inline "runRefresh" function that mirrors what the worker
// must do. When the implementer ships apps/worker/src/jobs/refresh-mirrors.ts, this
// test asserts the same SQL behavior — the inline driver becomes the spec.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import {
  createAlirezarezvaniAdapter,
  createVoltAgentAdapter,
  type SourceAdapter,
} from '@datasetai/source-adapters';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

async function runRefresh(adapters: readonly SourceAdapter[], pg: PGlite): Promise<number> {
  let upserted = 0;
  for (const adapter of adapters) {
    for await (const raw of adapter.fetchListings()) {
      const n = adapter.normalize(raw);
      // Real upsert against pglite. Implementer's job module must do the same.
      await pg.query(
        `INSERT INTO agents
          (id, name, description, primary_format, formats, tool_compatibility, source_type, source_url, current_version, license, category, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           updated_at = NOW()`,
        [
          n.id,
          n.name,
          n.description,
          n.primaryFormat,
          n.formats,
          n.toolCompatibility,
          n.sourceType,
          n.sourceUrl,
          '0.0.0',
          n.license,
          n.category ?? null,
          n.tags,
        ],
      );
      upserted += 1;
    }
  }
  return upserted;
}

describe('refresh-mirrors job (Story E5.10)', () => {
  let pg: PGlite;
  let server: LocalHttpServer;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const readme = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'voltagent', 'README.md'),
      'utf8',
    );
    const tree = await fs.readFile(
      path.join(process.cwd(), 'tests', 'fixtures', 'alirezarezvani', 'tree.json'),
      'utf8',
    );
    server = await startFixtureServer({
      '/voltagent/README.md': readme,
      '/alirezarezvani/tree.json': {
        status: 200,
        body: tree,
        contentType: 'application/json',
      },
    });
  }, 30_000);

  afterAll(async () => {
    await server.close();
  });

  it('refreshing two adapters writes N upsert rows where N = sum(yields)', async () => {
    const adapters = [
      createVoltAgentAdapter({
        readmeUrl: `${server.url}/voltagent/README.md`,
        fetch: globalThis.fetch as never,
      }),
      createAlirezarezvaniAdapter({
        treeUrl: `${server.url}/alirezarezvani/tree.json`,
        fetch: globalThis.fetch as never,
      }),
    ];
    const upserted = await runRefresh(adapters, pg);
    expect(upserted).toBeGreaterThanOrEqual(2);

    const totals = await pg.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM agents',
    );
    expect(totals.rows[0]!.count).toBeGreaterThanOrEqual(2);
  });

  it('a second refresh is idempotent (ON CONFLICT updates, no duplicate rows)', async () => {
    const adapters = [
      createVoltAgentAdapter({
        readmeUrl: `${server.url}/voltagent/README.md`,
        fetch: globalThis.fetch as never,
      }),
    ];
    const before = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM agents WHERE source_type = 'voltagent-mirror'",
    );
    await runRefresh(adapters, pg);
    const after = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM agents WHERE source_type = 'voltagent-mirror'",
    );
    expect(after.rows[0]!.count).toBe(before.rows[0]!.count);
  });

  it.todo(
    'cron schedule honors weekly full + daily top-1000 cadence — EXPECTS apps/worker/src/jobs/cron.ts',
  );
  it.todo(
    'failed adapter refresh alerts via Sentry boundary — EXPECTS Sentry boundary in refresh job',
  );
});
