// Tests for Story E4.7 — Unpublish Version.
// Real pglite. Asserts: setting agent_versions.unpublished_at hides the version
// from the listing query path, while existing rows remain (history preserved).

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

describe('unpublish version (Story E4.7)', () => {
  let pg: PGlite;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('bob@example.com', 'bob') RETURNING id",
    );
    const creatorId = u.rows[0]!.id;
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        'bob/agent',
        'Bob',
        'desc',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        creatorId,
        '2.0.0',
      ],
    );
    for (const v of ['1.0.0', '1.1.0', '2.0.0']) {
      await pg.query(
        `INSERT INTO agent_versions (agent_id, version, content_hash, content_size_bytes, manifest_url, content_url, format)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ['bob/agent', v, `sha256-${v}`, 1024, `https://cdn/agents/bob/agent/${v}.json`, 'https://cdn/c.tar.gz', 'claude-skill'],
      );
    }
  }, 30_000);

  it('unpublishing v1.0.0 sets unpublished_at on that version row only', async () => {
    await pg.query(
      `UPDATE agent_versions SET unpublished_at = NOW()
       WHERE agent_id = 'bob/agent' AND version = '1.0.0'`,
    );

    const target = await pg.query<{ unpublished_at: Date | null }>(
      "SELECT unpublished_at FROM agent_versions WHERE agent_id = 'bob/agent' AND version = '1.0.0'",
    );
    const sibling = await pg.query<{ unpublished_at: Date | null }>(
      "SELECT unpublished_at FROM agent_versions WHERE agent_id = 'bob/agent' AND version = '1.1.0'",
    );
    expect(target.rows[0]!.unpublished_at).not.toBeNull();
    expect(sibling.rows[0]!.unpublished_at).toBeNull();
  });

  it('listing query that filters unpublished_at IS NULL hides the unpublished version', async () => {
    const live = await pg.query<{ version: string }>(
      "SELECT version FROM agent_versions WHERE agent_id = 'bob/agent' AND unpublished_at IS NULL ORDER BY version",
    );
    const all = await pg.query<{ version: string }>(
      "SELECT version FROM agent_versions WHERE agent_id = 'bob/agent' ORDER BY version",
    );
    expect(all.rows.map((r) => r.version)).toEqual(['1.0.0', '1.1.0', '2.0.0']);
    expect(live.rows.map((r) => r.version)).toEqual(['1.1.0', '2.0.0']);
  });

  it('history is preserved — the unpublished row is NOT deleted', async () => {
    const res = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM agent_versions WHERE agent_id = 'bob/agent'",
    );
    expect(res.rows[0]!.count).toBe(3);
  });

  it.todo(
    'DELETE /api/v1/agents/:id/versions/:v handler tombstones row, requires creator auth — EXPECTS apps/web/app/api/v1/agents/[id]/versions/[v]/route.ts',
  );
});
