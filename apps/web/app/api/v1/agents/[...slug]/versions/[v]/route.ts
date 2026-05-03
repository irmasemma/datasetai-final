// DELETE /api/v1/agents/[slug]/versions/[v] — story E4.7 (unpublish version).
// Tombstones via unpublished_at; never hard-delete.

import { agentVersions } from '@datasetai/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../../lib/db';
import { getSession } from '../../../../../../../lib/auth';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string[]; v: string }> },
): Promise<Response> {
  const { slug, v } = await ctx.params;
  const agentId = Array.isArray(slug) ? slug.join('/') : slug;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });

  await db
    .update(agentVersions)
    .set({ unpublishedAt: new Date() })
    .where(and(eq(agentVersions.agentId, agentId), eq(agentVersions.version, v)));
  return NextResponse.json({ ok: true });
}
