// PATCH /api/v1/agents/[slug] — story E4.6 (edit metadata without version bump).
// Updates `agents` row only; versions stay frozen.

import { agents } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';

interface PatchBody {
  readonly name?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly category?: string | null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const body = (await req.json()) as PatchBody;

  const [existing] = await db.select().from(agents).where(eq(agents.id, slug)).limit(1);
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (existing.creatorId && existing.creatorId !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) update['name'] = body.name;
  if (body.summary !== undefined) update['description'] = body.summary;
  if (body.description !== undefined) update['longDescription'] = body.description;
  if (body.category !== undefined) update['category'] = body.category;
  if (body.tags !== undefined) update['tags'] = [...body.tags];

  await db.update(agents).set(update).where(eq(agents.id, slug));
  return NextResponse.json({ ok: true });
}
