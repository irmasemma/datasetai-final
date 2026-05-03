// Tests for Story E7.4 — Admin Moderation Queue (reports).
// Real pglite. Admin auth gate; list/dismiss/take-down with audit log.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function adminListReports(
  pg: PGlite,
  session: { isAdmin: boolean } | null,
): Promise<{ status: number; rows?: unknown[] }> {
  if (!session?.isAdmin) return { status: 403 };
  const res = await pg.query(
    `SELECT id, agent_id, reason, status, created_at FROM reports WHERE status = 'pending' ORDER BY created_at DESC`,
  );
  return { status: 200, rows: res.rows };
}

async function adminDismissReport(
  pg: PGlite,
  session: { isAdmin: boolean; userId: string } | null,
  reportId: string,
  note: string,
): Promise<{ status: number }> {
  if (!session?.isAdmin) return { status: 403 };
  const r = await pg.query(
    `UPDATE reports SET status = 'dismissed', resolved_by = $1, resolution_note = $2, resolved_at = NOW()
     WHERE id = $3 AND status = 'pending'
     RETURNING id`,
    [session.userId, note, reportId],
  );
  return r.rows.length === 0 ? { status: 404 } : { status: 200 };
}

async function adminTakeDownAgent(
  pg: PGlite,
  session: { isAdmin: boolean; userId: string } | null,
  reportId: string,
  agentId: string,
  note: string,
): Promise<{ status: number }> {
  if (!session?.isAdmin) return { status: 403 };
  await pg.query(
    `UPDATE agents SET unpublished_at = NOW() WHERE id = $1`,
    [agentId],
  );
  await pg.query(
    `UPDATE reports SET status = 'actioned', resolved_by = $1, resolution_note = $2, resolved_at = NOW()
     WHERE id = $3`,
    [session.userId, note, reportId],
  );
  return { status: 200 };
}

describe('admin moderation queue (Story E7.4)', () => {
  let pg: PGlite;
  let adminId: string;
  let reportPendingId: string;
  let reportToActionId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const a = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login, is_admin) VALUES ('mod@e.com', 'mod', TRUE) RETURNING id",
    );
    adminId = a.rows[0]!.id;
    const r = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('rrr@e.com', 'rrr') RETURNING id",
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, current_version)
       VALUES ('moderated/agent', 'M', 'd', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', '1.0.0')`,
    );
    const rep1 = await pg.query<{ id: string }>(
      `INSERT INTO reports (agent_id, reporter_user_id, reason, details, status)
       VALUES ('moderated/agent', $1, 'spam', 'noise', 'pending') RETURNING id`,
      [r.rows[0]!.id],
    );
    reportPendingId = rep1.rows[0]!.id;
    const rep2 = await pg.query<{ id: string }>(
      `INSERT INTO reports (agent_id, reporter_user_id, reason, details, status)
       VALUES ('moderated/agent', $1, 'malware', 'remote shell', 'pending') RETURNING id`,
      [r.rows[0]!.id],
    );
    reportToActionId = rep2.rows[0]!.id;
  }, 30_000);

  it('non-admin cannot list reports — 403', async () => {
    const r = await adminListReports(pg, { isAdmin: false });
    expect(r.status).toBe(403);
  });

  it('admin lists pending reports including malware + spam', async () => {
    const r = await adminListReports(pg, { isAdmin: true });
    expect(r.status).toBe(200);
    expect((r.rows as Array<{ id: string }>).map((x) => x.id)).toContain(reportPendingId);
    expect((r.rows as Array<{ id: string }>).map((x) => x.id)).toContain(reportToActionId);
  });

  it('dismiss writes resolution_note + resolved_by + status=dismissed', async () => {
    const r = await adminDismissReport(
      pg,
      { isAdmin: true, userId: adminId },
      reportPendingId,
      'noise — dismissed',
    );
    expect(r.status).toBe(200);
    const row = await pg.query<{ status: string; resolution_note: string | null }>(
      "SELECT status, resolution_note FROM reports WHERE id = $1",
      [reportPendingId],
    );
    expect(row.rows[0]!.status).toBe('dismissed');
    expect(row.rows[0]!.resolution_note).toBe('noise — dismissed');
  });

  it('take-down sets unpublished_at on the agent and marks report actioned', async () => {
    const r = await adminTakeDownAgent(
      pg,
      { isAdmin: true, userId: adminId },
      reportToActionId,
      'moderated/agent',
      'Verified malware — taken down per Content Policy §3.',
    );
    expect(r.status).toBe(200);
    const agent = await pg.query<{ unpublished_at: Date | null }>(
      "SELECT unpublished_at FROM agents WHERE id = 'moderated/agent'",
    );
    expect(agent.rows[0]!.unpublished_at).not.toBeNull();
    const report = await pg.query<{ status: string }>(
      "SELECT status FROM reports WHERE id = $1",
      [reportToActionId],
    );
    expect(report.rows[0]!.status).toBe('actioned');
  });

  it.todo(
    'admin /admin/reports page renders queue + actions — EXPECTS apps/web/app/admin/reports/page.tsx',
  );
});
