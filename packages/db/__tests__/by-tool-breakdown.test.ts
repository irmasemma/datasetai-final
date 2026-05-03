// Tests for Story E6.2 — By-Tool Breakdown.
// Real pglite, real GROUP BY tool_detected.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function byToolBreakdown(
  pg: PGlite,
  agentId: string,
): Promise<Record<string, number>> {
  const res = await pg.query<{ tool: string | null; count: number }>(
    `SELECT COALESCE(tool_detected, 'unknown') AS tool, COUNT(*)::int AS count
     FROM installs
     WHERE agent_id = $1 AND success = TRUE
     GROUP BY tool`,
    [agentId],
  );
  const out: Record<string, number> = {};
  for (const r of res.rows) out[r.tool ?? 'unknown'] = r.count;
  return out;
}

describe('by-tool breakdown (Story E6.2)', () => {
  let pg: PGlite;
  const agentId = 'creator/by-tool';

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('bt@e.com', 'bt') RETURNING id",
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, 'X', 'y', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code','cursor']::text[], 'direct-publish', $2, '1.0.0')`,
      [agentId, u.rows[0]!.id],
    );
    const tools = [
      ...Array.from({ length: 7 }, () => 'claude-code'),
      ...Array.from({ length: 3 }, () => 'cursor'),
      ...Array.from({ length: 2 }, () => null),
    ];
    let i = 0;
    for (const tool of tools) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success)
         VALUES ($1, '1.0.0', $2, $3, 'claude-skill', TRUE)`,
        [agentId, `iid-${i++}`, tool],
      );
    }
  }, 30_000);

  it('groups installs by tool_detected with explicit "unknown" bucket', async () => {
    const result = await byToolBreakdown(pg, agentId);
    expect(result['claude-code']).toBe(7);
    expect(result['cursor']).toBe(3);
    expect(result['unknown']).toBe(2);
  });

  it('totals sum to the lifetime installs count', async () => {
    const result = await byToolBreakdown(pg, agentId);
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(12);
  });
});
