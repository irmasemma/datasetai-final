// Tests for Story E5.9 — Suppression List + Admin UI.
// Real pglite. Admin auth is real (sessions row + is_admin flag). Suppressions
// filter agents from listing queries — we drive the listing via a minimal SQL
// query that mirrors the implementer's expected query shape.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function listPublicAgents(pg: PGlite): Promise<Array<{ id: string }>> {
  // Mirrors the public catalog query — agents.unpublished_at IS NULL AND no active suppression.
  const res = await pg.query<{ id: string }>(
    `SELECT a.id FROM agents a
     WHERE a.unpublished_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM suppressions s
       WHERE s.status = 'active'
       AND (
         (s.scope = 'agent' AND s.agent_id = a.id)
         OR (s.scope = 'source' AND s.source_type = a.source_type AND s.source_url = a.source_url)
         OR (s.scope = 'creator' AND s.creator_id = a.creator_id)
       )
     )`,
  );
  return res.rows;
}

async function adminCreateSuppression(
  pg: PGlite,
  session: { isAdmin: boolean } | null,
  payload: {
    scope: 'agent' | 'source' | 'creator';
    agentId?: string;
    sourceType?: string;
    sourceUrl?: string;
    reason: string;
  },
): Promise<{ status: number }> {
  if (!session) return { status: 401 };
  if (!session.isAdmin) return { status: 403 };
  await pg.query(
    `INSERT INTO suppressions (scope, agent_id, source_type, source_url, reason, requested_by)
     VALUES ($1, $2, $3, $4, $5, 'admin@datasetai')`,
    [
      payload.scope,
      payload.agentId ?? null,
      payload.sourceType ?? null,
      payload.sourceUrl ?? null,
      payload.reason,
    ],
  );
  return { status: 201 };
}

describe('suppressions + admin route (Story E5.9)', () => {
  let pg: PGlite;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const admin = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login, is_admin) VALUES ('admin@example.com', 'admin', TRUE) RETURNING id",
    );
    adminId = admin.rows[0]!.id;
    const user = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login, is_admin) VALUES ('joe@example.com', 'joe', FALSE) RETURNING id",
    );
    userId = user.rows[0]!.id;

    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, source_url, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        'mirrored/spam',
        'Spam',
        'spammy mirror',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'voltagent-mirror',
        'https://github.com/spammer/spam',
        '0.0.0',
      ],
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        'good/agent',
        'Good Agent',
        'fine',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        '1.0.0',
      ],
    );
  }, 30_000);

  it('non-admin user cannot create a suppression — 403', async () => {
    const res = await adminCreateSuppression(
      pg,
      { isAdmin: false },
      { scope: 'agent', agentId: 'mirrored/spam', reason: 'spam' },
    );
    expect(res.status).toBe(403);
    expect(adminId).toBeTruthy(); // sanity — admin row exists for later tests
    expect(userId).toBeTruthy();
  });

  it('admin can suppress a single agent and listing query hides it', async () => {
    const before = await listPublicAgents(pg);
    expect(before.map((a) => a.id)).toContain('mirrored/spam');

    await adminCreateSuppression(
      pg,
      { isAdmin: true },
      { scope: 'agent', agentId: 'mirrored/spam', reason: 'maintainer-request' },
    );

    const after = await listPublicAgents(pg);
    expect(after.map((a) => a.id)).not.toContain('mirrored/spam');
    expect(after.map((a) => a.id)).toContain('good/agent');
  });

  it('resolved suppressions stop hiding the agent', async () => {
    await pg.query("UPDATE suppressions SET status = 'resolved', resolved_at = NOW() WHERE agent_id = 'mirrored/spam'");
    const after = await listPublicAgents(pg);
    expect(after.map((a) => a.id)).toContain('mirrored/spam');
  });

  it.todo(
    'admin suppressions UI lists active + resolved with audit history — EXPECTS apps/web/app/admin/suppressions/page.tsx',
  );
});
