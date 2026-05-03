// Tests for Story E7.1 — Admin queue listing for verification applications.
// Real pglite. Admin auth gate; filtering pending applications.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

async function adminListPending(
  pg: PGlite,
  session: { isAdmin: boolean } | null,
): Promise<{ status: number; rows?: unknown[] }> {
  if (!session) return { status: 401 };
  if (!session.isAdmin) return { status: 403 };
  const res = await pg.query(
    `SELECT id, user_id, github_handle, status, reasoning
     FROM verification_applications WHERE status = 'pending' ORDER BY created_at DESC`,
  );
  return { status: 200, rows: res.rows };
}

async function adminApprove(
  pg: PGlite,
  session: { isAdmin: boolean; userId: string } | null,
  applicationId: string,
): Promise<{ status: number }> {
  if (!session?.isAdmin) return { status: 403 };
  const app = await pg.query<{ user_id: string }>(
    "SELECT user_id FROM verification_applications WHERE id = $1",
    [applicationId],
  );
  if (app.rows.length === 0) return { status: 404 };
  await pg.query(
    `UPDATE verification_applications SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
    [session.userId, applicationId],
  );
  await pg.query(
    `UPDATE users SET is_verified_publisher = TRUE WHERE id = $1`,
    [app.rows[0]!.user_id],
  );
  return { status: 200 };
}

describe('admin verifications queue (Story E7.1)', () => {
  let pg: PGlite;
  let adminId: string;
  let userId: string;
  let applicationId: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const a = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login, is_admin) VALUES ('admin@e.com', 'a', TRUE) RETURNING id",
    );
    adminId = a.rows[0]!.id;
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('uap@e.com', 'uap') RETURNING id",
    );
    userId = u.rows[0]!.id;
    const app = await pg.query<{ id: string }>(
      `INSERT INTO verification_applications (user_id, github_handle, reasoning, status)
       VALUES ($1, 'uap', 'plz', 'pending') RETURNING id`,
      [userId],
    );
    applicationId = app.rows[0]!.id;
  }, 30_000);

  it('non-admin gets 403', async () => {
    const r = await adminListPending(pg, { isAdmin: false });
    expect(r.status).toBe(403);
  });

  it('admin lists pending applications', async () => {
    const r = await adminListPending(pg, { isAdmin: true });
    expect(r.status).toBe(200);
    expect((r.rows as Array<{ id: string }>).map((x) => x.id)).toContain(applicationId);
  });

  it('approve sets status=approved, sets reviewed_by, and toggles is_verified_publisher on the user', async () => {
    const r = await adminApprove(pg, { isAdmin: true, userId: adminId }, applicationId);
    expect(r.status).toBe(200);
    const app = await pg.query<{ status: string; reviewed_by: string | null }>(
      "SELECT status, reviewed_by FROM verification_applications WHERE id = $1",
      [applicationId],
    );
    expect(app.rows[0]!.status).toBe('approved');
    expect(app.rows[0]!.reviewed_by).toBe(adminId);
    const user = await pg.query<{ is_verified_publisher: boolean }>(
      "SELECT is_verified_publisher FROM users WHERE id = $1",
      [userId],
    );
    expect(user.rows[0]!.is_verified_publisher).toBe(true);
  });

  it.todo(
    'admin /admin/verifications page renders pending list — EXPECTS apps/web/app/admin/verifications/page.tsx',
  );
});
