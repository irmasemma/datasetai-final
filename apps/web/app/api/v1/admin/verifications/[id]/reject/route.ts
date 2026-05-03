// POST /api/v1/admin/verifications/[id]/reject — admin rejection with optional reviewer note.

import { verificationApplications } from '@datasetai/db';
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
  const fd = await req.formData().catch(() => null);
  const note = fd?.get('note')?.toString() ?? null;
  await db
    .update(verificationApplications)
    .set({
      status: 'rejected',
      reviewedBy: guard.userId,
      reviewerNote: note,
      reviewedAt: new Date(),
    })
    .where(eq(verificationApplications.id, id));
  return NextResponse.redirect(new URL('/admin/verifications', req.url));
}
