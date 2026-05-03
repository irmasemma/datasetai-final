// POST /api/v1/admin/claims/[id]/approve — sets agents.creator_id and resolves claim.

import { agents, claimRequests } from '@datasetai/db';
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
  const [claim] = await db.select().from(claimRequests).where(eq(claimRequests.id, id)).limit(1);
  if (!claim) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await db.update(agents).set({ creatorId: claim.claimerUserId }).where(eq(agents.id, claim.agentId));
  await db
    .update(claimRequests)
    .set({ status: 'approved', reviewedBy: guard.userId, reviewedAt: new Date() })
    .where(eq(claimRequests.id, id));
  return NextResponse.redirect(new URL('/admin/claims', req.url));
}
