// Tests for Story E7.1 — Verified-Publisher Application + Admin Queue (write path).
// Real pglite. Submitting an application creates a verification_applications row
// with status=pending and the user's session-bound github handle.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function resolveSession(
  pg: PGlite,
  sessionId: string | null,
): Promise<{ userId: string; githubLogin: string | null } | null> {
  if (!sessionId) return null;
  const res = await pg.query<{ user_id: string; github_login: string | null }>(
    `SELECT u.id AS user_id, u.github_login
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId],
  );
  if (res.rows.length === 0) return null;
  return { userId: res.rows[0]!.user_id, githubLogin: res.rows[0]!.github_login };
}

async function postVerification(
  pg: PGlite,
  sessionId: string | null,
  reasoning: string,
): Promise<{ status: number; body?: unknown }> {
  const session = await resolveSession(pg, sessionId);
  if (!session) return { status: 401 };
  if (!session.githubLogin) return { status: 400, body: { error: 'GITHUB_HANDLE_REQUIRED' } };
  const r = await pg.query<{ id: string }>(
    `INSERT INTO verification_applications (user_id, github_handle, reasoning, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id`,
    [session.userId, session.githubLogin, reasoning],
  );
  return { status: 201, body: { id: r.rows[0]!.id } };
}

describe('verification application (Story E7.1)', () => {
  let pg: PGlite;
  let sessionId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('vp@e.com', 'vp') RETURNING id",
    );
    sessionId = 'sess-verify-' + Date.now();
    await pg.query(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [sessionId, u.rows[0]!.id],
    );
  }, 30_000);

  it('rejects unauthenticated request with 401', async () => {
    const r = await postVerification(pg, null, 'I want the badge.');
    expect(r.status).toBe(401);
  });

  it('writes a verification_applications row with status=pending', async () => {
    const r = await postVerification(pg, sessionId, 'I run an agent agency, here is my portfolio.');
    expect(r.status).toBe(201);
    const row = await pg.query<{ status: string; github_handle: string }>(
      "SELECT status, github_handle FROM verification_applications WHERE github_handle = 'vp'",
    );
    expect(row.rows[0]!.status).toBe('pending');
    expect(row.rows[0]!.github_handle).toBe('vp');
  });

  it.todo(
    'POST /api/v1/verification handler returns 201 with new application ID — EXPECTS implementer route',
  );
});
