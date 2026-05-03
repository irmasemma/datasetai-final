// Tests for Story E4.2 — Web Publish Flow.
// The route page (/publish) and route handler aren't shipped yet; this file pins
// the contract for the parts that ARE shippable today: DB-level assertions on
// `agents` + `agent_versions` rows that the publish handler must produce.
//
// Real pglite, real schema, real inserts. The route-level assertions are it.todo
// until the implementer ships the page/handler — never deleted.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

describe('publish flow DB invariants (Story E4.2)', () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = await bootstrapPglite();
  }, 30_000);

  it('a successful publish writes one agents row + one agent_versions row', async () => {
    const userRes = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('pub1@example.com', 'pub1') RETURNING id",
    );
    const creatorId = userRes.rows[0]!.id;

    await pg.query(
      `INSERT INTO agents
        (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version, license)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'pub1/sample-agent',
        'Sample Agent',
        'A real one',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        creatorId,
        '0.1.0',
        'MIT',
      ],
    );
    await pg.query(
      `INSERT INTO agent_versions
        (agent_id, version, content_hash, content_size_bytes, manifest_url, content_url, format)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'pub1/sample-agent',
        '0.1.0',
        'sha256-' + 'a'.repeat(64),
        2048,
        'https://cdn.test/agents/pub1/sample-agent/0.1.0.json',
        'https://cdn.test/content/' + 'a'.repeat(64) + '.tar.gz',
        'claude-skill',
      ],
    );

    const agentRes = await pg.query<{ id: string; license: string | null }>(
      "SELECT id, license FROM agents WHERE id = 'pub1/sample-agent'",
    );
    const versionRes = await pg.query<{ version: string }>(
      "SELECT version FROM agent_versions WHERE agent_id = 'pub1/sample-agent'",
    );
    expect(agentRes.rows).toHaveLength(1);
    expect(agentRes.rows[0]!.license).toBe('MIT');
    expect(versionRes.rows).toHaveLength(1);
    expect(versionRes.rows[0]!.version).toBe('0.1.0');
  });

  it('agents.license accepts null at the row level (E7.5 must enforce at the route layer)', async () => {
    const userRes = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('pub2@example.com', 'pub2') RETURNING id",
    );
    const creatorId = userRes.rows[0]!.id;
    await pg.query(
      `INSERT INTO agents
        (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'pub2/no-license',
        'No License',
        'license null at row level',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        creatorId,
        '0.1.0',
      ],
    );
    const res = await pg.query<{ license: string | null }>(
      "SELECT license FROM agents WHERE id = 'pub2/no-license'",
    );
    expect(res.rows[0]!.license).toBeNull();
  });

  it.todo(
    'render /publish page submits the form and redirects to /agents/<id> within 30s — EXPECTS apps/web/app/publish/page.tsx + POST /api/v1/publish',
  );
  it.todo(
    'preview shows detected formats + linter warnings before submit — EXPECTS publish UI client component',
  );
});
