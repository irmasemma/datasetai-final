// Tests for Story E5.8 — Claim Listing Flow.
// Real pglite, real auth-shaped session lookup. The route handler isn't shipped yet;
// we test the DB layer's claim_requests insert path + auth gate via an inline driver
// that mirrors what POST /api/v1/claim must do.

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

async function postClaim(
  pg: PGlite,
  sessionId: string | null,
  agentId: string,
  proof: string,
): Promise<{ status: number; body?: unknown }> {
  const session = await resolveSession(pg, sessionId);
  if (!session) return { status: 401, body: { error: 'AUTH_REQUIRED' } };
  // Confirm the listing exists.
  const a = await pg.query<{ id: string; creator_id: string | null }>(
    'SELECT id, creator_id FROM agents WHERE id = $1',
    [agentId],
  );
  if (a.rows.length === 0) return { status: 404, body: { error: 'NOT_FOUND' } };
  if (a.rows[0]!.creator_id !== null) return { status: 409, body: { error: 'ALREADY_CLAIMED' } };
  const r = await pg.query<{ id: string }>(
    `INSERT INTO claim_requests (agent_id, claimer_user_id, github_proof, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id`,
    [agentId, session.userId, proof],
  );
  return { status: 201, body: { claimId: r.rows[0]!.id } };
}

describe('claim listing flow (Story E5.8)', () => {
  let pg: PGlite;
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('claimer@example.com', 'claimer') RETURNING id",
    );
    userId = u.rows[0]!.id;
    sessionId = 'sess-claim-' + Date.now();
    await pg.query(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
      [sessionId, userId],
    );
    // Unclaimed mirrored listing.
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, source_url, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        'voltagent/unclaimed',
        'Unclaimed Skill',
        'no creator yet',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'voltagent-mirror',
        'https://github.com/voltagent/unclaimed',
        '0.0.0',
      ],
    );
  }, 30_000);

  it('rejects with 401 when no session cookie is present', async () => {
    const res = await postClaim(pg, null, 'voltagent/unclaimed', 'github-proof-token');
    expect(res.status).toBe(401);
  });

  it('returns 404 when the listing does not exist', async () => {
    const res = await postClaim(pg, sessionId, 'does/not-exist', 'p');
    expect(res.status).toBe(404);
  });

  it('writes a claim_requests row with status=pending when authenticated', async () => {
    const res = await postClaim(pg, sessionId, 'voltagent/unclaimed', 'github-proof-token');
    expect(res.status).toBe(201);
    const row = await pg.query<{ status: string; agent_id: string }>(
      "SELECT status, agent_id FROM claim_requests WHERE claimer_user_id = $1",
      [userId],
    );
    expect(row.rows[0]!.status).toBe('pending');
    expect(row.rows[0]!.agent_id).toBe('voltagent/unclaimed');
  });

  it.todo(
    'POST /api/v1/agents/:id/claim handler verifies GitHub commit access via real OAuth token — EXPECTS implementer route + GitHub API client (mocked at OAuth IdP boundary only)',
  );
});
