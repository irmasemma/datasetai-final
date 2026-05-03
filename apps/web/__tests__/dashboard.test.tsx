// Tests for Stories E6.1 + E6.2 + E6.4 — Creator Dashboard.
// The dashboard page (apps/web/app/me/agents/[id]/dashboard/page.tsx) hasn't shipped.
// We test the data layer the page must consume — auth-gated metrics, against pglite.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

interface SessionRow {
  readonly userId: string;
  readonly isAdmin: boolean;
}

async function resolveSession(
  pg: PGlite,
  sessionId: string | null | undefined,
): Promise<SessionRow | null> {
  if (!sessionId) return null;
  const res = await pg.query<{ user_id: string; is_admin: boolean }>(
    `SELECT u.id AS user_id, u.is_admin
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId],
  );
  if (res.rows.length === 0) return null;
  return { userId: res.rows[0]!.user_id, isAdmin: res.rows[0]!.is_admin };
}

async function loadDashboard(
  pg: PGlite,
  sessionId: string | null,
  agentId: string,
): Promise<{ status: number; data?: unknown }> {
  const session = await resolveSession(pg, sessionId);
  if (!session) return { status: 401 };
  const owner = await pg.query<{ creator_id: string | null }>(
    'SELECT creator_id FROM agents WHERE id = $1',
    [agentId],
  );
  if (owner.rows.length === 0) return { status: 404 };
  if (owner.rows[0]!.creator_id !== session.userId && !session.isAdmin) {
    return { status: 403 };
  }
  const totals = await pg.query<{ lifetime: number; last30: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE success = TRUE)::int AS lifetime,
       COUNT(*) FILTER (WHERE success = TRUE AND created_at > NOW() - INTERVAL '30 days')::int AS last30
     FROM installs WHERE agent_id = $1`,
    [agentId],
  );
  const byTool = await pg.query<{ tool: string | null; count: number }>(
    `SELECT COALESCE(tool_detected, 'unknown') AS tool, COUNT(*)::int AS count
     FROM installs WHERE agent_id = $1 AND success = TRUE
     GROUP BY tool`,
    [agentId],
  );
  const byVersion = await pg.query<{ version: string; count: number }>(
    `SELECT version, COUNT(*)::int AS count
     FROM installs
     WHERE agent_id = $1 AND success = TRUE AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY version`,
    [agentId],
  );
  return {
    status: 200,
    data: {
      lifetime: totals.rows[0]!.lifetime,
      last30: totals.rows[0]!.last30,
      byTool: byTool.rows,
      byVersion: byVersion.rows,
    },
  };
}

describe('creator dashboard data layer (Stories E6.1 + E6.2 + E6.4)', () => {
  let pg: PGlite;
  let creatorId: string;
  let creatorSession: string;
  let intruderSession: string;
  const agentId = 'creator/dash-agent';

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('owner@e.com', 'owner') RETURNING id",
    );
    creatorId = u.rows[0]!.id;
    const v = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('intruder@e.com', 'intruder') RETURNING id",
    );
    creatorSession = 'sess-creator-' + Date.now();
    intruderSession = 'sess-intruder-' + Date.now();
    await pg.query(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [creatorSession, creatorId],
    );
    await pg.query(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [intruderSession, v.rows[0]!.id],
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, 'D', 'd', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', $2, '1.1.0')`,
      [agentId, creatorId],
    );
    for (let i = 0; i < 5; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success)
         VALUES ($1, '1.0.0', $2, 'claude-code', 'claude-skill', TRUE)`,
        [agentId, `i-${i}`],
      );
    }
    for (let i = 0; i < 3; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success)
         VALUES ($1, '1.1.0', $2, 'cursor', 'claude-skill', TRUE)`,
        [agentId, `j-${i}`],
      );
    }
  }, 30_000);

  it('rejects unauthenticated request with 401', async () => {
    const r = await loadDashboard(pg, null, agentId);
    expect(r.status).toBe(401);
  });

  it('rejects logged-in but non-owner user with 403', async () => {
    const r = await loadDashboard(pg, intruderSession, agentId);
    expect(r.status).toBe(403);
  });

  it('returns 404 for an agent that does not exist', async () => {
    const r = await loadDashboard(pg, creatorSession, 'no/such');
    expect(r.status).toBe(404);
  });

  it('owner sees lifetime + 30d + by-tool + by-version metrics', async () => {
    const r = await loadDashboard(pg, creatorSession, agentId);
    expect(r.status).toBe(200);
    const d = r.data as {
      lifetime: number;
      last30: number;
      byTool: Array<{ tool: string; count: number }>;
      byVersion: Array<{ version: string; count: number }>;
    };
    expect(d.lifetime).toBe(8);
    expect(d.last30).toBe(8);
    const tools = Object.fromEntries(d.byTool.map((b) => [b.tool, b.count]));
    expect(tools['claude-code']).toBe(5);
    expect(tools['cursor']).toBe(3);
    const versions = Object.fromEntries(d.byVersion.map((b) => [b.version, b.count]));
    expect(versions['1.0.0']).toBe(5);
    expect(versions['1.1.0']).toBe(3);
  });

  it.todo(
    'GET /me/agents/<id>/dashboard SSR page renders charts — EXPECTS apps/web/app/me/agents/[id]/dashboard/page.tsx',
  );
});
