// Tests for Story E7.3 — Listing Report Flow.
// Real pglite + real session lookup. POST creates a reports row; auth is
// gated; rate-limited to 3/hour/user.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function resolveSession(
  pg: PGlite,
  sessionId: string | null,
): Promise<{ userId: string } | null> {
  if (!sessionId) return null;
  const res = await pg.query<{ user_id: string }>(
    `SELECT u.id AS user_id FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId],
  );
  return res.rows.length === 0 ? null : { userId: res.rows[0]!.user_id };
}

async function postReport(
  pg: PGlite,
  sessionId: string | null,
  payload: { agentId: string; reason: string; details?: string },
): Promise<{ status: number }> {
  const session = await resolveSession(pg, sessionId);
  if (!session) return { status: 401 };

  // Rate limit: 3 reports/hour/user.
  const recent = await pg.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM reports
     WHERE reporter_user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [session.userId],
  );
  if (recent.rows[0]!.count >= 3) return { status: 429 };

  await pg.query(
    `INSERT INTO reports (agent_id, reporter_user_id, reason, details, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [payload.agentId, session.userId, payload.reason, payload.details ?? null],
  );
  return { status: 201 };
}

describe('listing report flow (Story E7.3)', () => {
  let pg: PGlite;
  let sessionId: string;
  let userId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('reporter@e.com', 'r') RETURNING id",
    );
    userId = u.rows[0]!.id;
    sessionId = 'sess-report-' + Date.now();
    await pg.query(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [sessionId, userId],
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, current_version)
       VALUES ('reported/agent', 'X', 'y', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', '1.0.0')`,
    );
  }, 30_000);

  it('rejects unauthenticated POST with 401', async () => {
    const r = await postReport(pg, null, { agentId: 'reported/agent', reason: 'spam' });
    expect(r.status).toBe(401);
  });

  it('writes a reports row with status=pending', async () => {
    const r = await postReport(pg, sessionId, {
      agentId: 'reported/agent',
      reason: 'malware',
      details: 'embeds remote shell',
    });
    expect(r.status).toBe(201);
    const row = await pg.query<{ status: string; reason: string }>(
      "SELECT status, reason FROM reports WHERE reporter_user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    expect(row.rows[0]!.status).toBe('pending');
    expect(row.rows[0]!.reason).toBe('malware');
  });

  it('rate-limits to 3 reports/hour/user — 4th returns 429', async () => {
    // We've already submitted 1 above. Submit two more to reach the cap.
    await postReport(pg, sessionId, { agentId: 'reported/agent', reason: 'spam' });
    await postReport(pg, sessionId, { agentId: 'reported/agent', reason: 'copyright' });
    const fourth = await postReport(pg, sessionId, {
      agentId: 'reported/agent',
      reason: 'broken',
    });
    expect(fourth.status).toBe(429);
  });

  it.todo(
    'POST /api/v1/reports handler returns email-confirmation on success — EXPECTS implementer route + Resend boundary (mocked at the SDK call site only)',
  );
});
