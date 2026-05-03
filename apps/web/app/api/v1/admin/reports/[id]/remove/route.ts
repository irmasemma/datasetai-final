// POST /api/v1/admin/reports/[id]/remove — story E7.4 + E7.6.
// Takes down the listing (sets unpublished_at on the agent), creates a suppressions row,
// drops a moderation_notification for the creator, and resolves the report.

import { agents, moderationNotifications, reports, suppressions } from '@datasetai/db';
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
  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const [agent] = await db.select().from(agents).where(eq(agents.id, report.agentId)).limit(1);
  if (!agent) return NextResponse.json({ error: 'AGENT_NOT_FOUND' }, { status: 404 });
  await db.update(agents).set({ unpublishedAt: new Date() }).where(eq(agents.id, agent.id));
  await db.insert(suppressions).values({
    scope: 'agent',
    agentId: agent.id,
    reason: `Takedown via report ${id}: ${report.reason}`,
    requestedBy: guard.userId,
  });
  if (agent.creatorId) {
    await db.insert(moderationNotifications).values({
      userId: agent.creatorId,
      agentId: agent.id,
      kind: 'takedown',
      message:
        `Your listing ${agent.id} was taken down following a moderation review. Reason: ${report.reason}.` +
        ' Reply to support@datasetai.xyz to appeal.',
    });
  }
  await db
    .update(reports)
    .set({ status: 'removed', resolvedBy: guard.userId, resolvedAt: new Date() })
    .where(eq(reports.id, id));
  return NextResponse.redirect(new URL('/admin/reports', req.url));
}
