// POST /api/v1/admin/verifications/[id]/approve — flips users.is_verified_publisher.

import { users, verificationApplications } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '../../../../../../../lib/admin';
import { getDb } from '../../../../../../../lib/db';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const { id } = await ctx.params;
  const [app] = await db
    .select()
    .from(verificationApplications)
    .where(eq(verificationApplications.id, id))
    .limit(1);
  if (!app) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await db.update(users).set({ isVerifiedPublisher: true }).where(eq(users.id, app.userId));
  await db
    .update(verificationApplications)
    .set({
      status: 'approved',
      reviewedBy: guard.userId,
      reviewedAt: new Date(),
    })
    .where(eq(verificationApplications.id, id));
  return NextResponse.redirect(new URL('/admin/verifications', req.url));
}
