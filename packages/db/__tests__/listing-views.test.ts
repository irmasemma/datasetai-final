// Tests for Story E6.3 — Listing Performance (Views, Search Rank).
// Real pglite, real listing_views row writes + aggregates.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function recordView(
  pg: PGlite,
  args: { agentId: string; viewerUserId?: string | null; referrer?: string; searchQuery?: string },
): Promise<void> {
  await pg.query(
    `INSERT INTO listing_views (agent_id, viewer_user_id, referrer, search_query)
     VALUES ($1, $2, $3, $4)`,
    [
      args.agentId,
      args.viewerUserId ?? null,
      args.referrer ?? null,
      args.searchQuery ?? null,
    ],
  );
}

async function topSearchQueries(
  pg: PGlite,
  agentId: string,
  windowDays = 30,
): Promise<Array<{ query: string; count: number }>> {
  const res = await pg.query<{ query: string; count: number }>(
    `SELECT search_query AS query, COUNT(*)::int AS count
     FROM listing_views
     WHERE agent_id = $1 AND search_query IS NOT NULL
     AND created_at > NOW() - ($2 || ' days')::interval
     GROUP BY search_query
     ORDER BY count DESC`,
    [agentId, windowDays],
  );
  return res.rows;
}

describe('listing_views aggregates (Story E6.3)', () => {
  let pg: PGlite;
  const agentId = 'creator/views-agent';

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('v@e.com', 'v') RETURNING id",
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, 'V', 'd', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', $2, '1.0.0')`,
      [agentId, u.rows[0]!.id],
    );
  }, 30_000);

  it('inserts a listing_views row', async () => {
    await recordView(pg, { agentId, searchQuery: 'code review' });
    const res = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM listing_views WHERE agent_id = $1",
      [agentId],
    );
    expect(res.rows[0]!.count).toBeGreaterThan(0);
  });

  it('aggregates top search queries that surfaced this listing', async () => {
    for (let i = 0; i < 5; i++) await recordView(pg, { agentId, searchQuery: 'code review' });
    for (let i = 0; i < 2; i++) await recordView(pg, { agentId, searchQuery: 'pr reviewer' });
    await recordView(pg, { agentId }); // no query
    const top = await topSearchQueries(pg, agentId, 30);
    expect(top[0]!.query).toBe('code review');
    expect(top[0]!.count).toBeGreaterThanOrEqual(5);
  });
});
