// POST /api/v1/admin/reports/[id]/dismiss — admin dismisses a report.

import { reports } from '@datasetai/db';
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
  await db
    .update(reports)
    .set({ status: 'dismissed', resolvedBy: guard.userId, resolvedAt: new Date() })
    .where(eq(reports.id, id));
  return NextResponse.redirect(new URL('/admin/reports', req.url));
}
