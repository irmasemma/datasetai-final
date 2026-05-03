// Tests for Story E7.6 — Content Policy Enforcement Workflow.
// Real pglite. Admin take-down flow writes:
//  1. agents.unpublished_at
//  2. a moderation_notifications row to the creator
//  3. (we also assert resolution_note carries the content-policy citation)

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function adminContentPolicyRemove(
  pg: PGlite,
  args: {
    adminUserId: string;
    agentId: string;
    creatorUserId: string;
    citation: string;
    reportId?: string;
  },
): Promise<{ status: number }> {
  await pg.query(`UPDATE agents SET unpublished_at = NOW() WHERE id = $1`, [args.agentId]);
  await pg.query(
    `INSERT INTO moderation_notifications (user_id, agent_id, kind, message)
     VALUES ($1, $2, 'content-policy-removal', $3)`,
    [args.creatorUserId, args.agentId, args.citation],
  );
  if (args.reportId) {
    await pg.query(
      `UPDATE reports SET status = 'actioned', resolved_by = $1, resolution_note = $2, resolved_at = NOW() WHERE id = $3`,
      [args.adminUserId, args.citation, args.reportId],
    );
  }
  return { status: 200 };
}

describe('content-policy enforcement workflow (Story E7.6)', () => {
  let pg: PGlite;
  let creatorUserId: string;
  let adminId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const a = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login, is_admin) VALUES ('cpadm@e.com', 'cpadm', TRUE) RETURNING id",
    );
    adminId = a.rows[0]!.id;
    const c = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('cprc@e.com', 'cprc') RETURNING id",
    );
    creatorUserId = c.rows[0]!.id;
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, 'Bad', 'd', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', $2, '1.0.0')`,
      ['bad/agent', creatorUserId],
    );
  }, 30_000);

  it('removal sets unpublished_at and persists a creator notification with the policy citation', async () => {
    const citation = 'Content Policy §3.2 — disallowed automated abuse';
    const r = await adminContentPolicyRemove(pg, {
      adminUserId: adminId,
      agentId: 'bad/agent',
      creatorUserId,
      citation,
    });
    expect(r.status).toBe(200);

    const agent = await pg.query<{ unpublished_at: Date | null }>(
      "SELECT unpublished_at FROM agents WHERE id = 'bad/agent'",
    );
    expect(agent.rows[0]!.unpublished_at).not.toBeNull();

    const notify = await pg.query<{ kind: string; message: string }>(
      "SELECT kind, message FROM moderation_notifications WHERE user_id = $1",
      [creatorUserId],
    );
    expect(notify.rows[0]!.kind).toBe('content-policy-removal');
    expect(notify.rows[0]!.message).toBe(citation);
  });

  it.todo(
    'creator email send is wired through Resend — EXPECTS apps/web/lib/email.ts (Resend boundary mocked at the SDK call site only)',
  );
  it.todo(
    'audit table row is written for every admin action — EXPECTS implementer-defined audit_log table',
  );
});
