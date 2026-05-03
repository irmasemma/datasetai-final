// POST /api/v1/admin/suppressions — admin adds a suppression.

import { suppressions } from '@datasetai/db';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '../../../../../lib/admin';
import { getDb } from '../../../../../lib/db';

interface Body {
  readonly scope?: string;
  readonly agentId?: string;
  readonly sourceType?: string;
  readonly sourceUrl?: string;
  readonly reason?: string;
  readonly requestedBy?: string;
}

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.scope || !body.reason) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 422 });
  }
  await db.insert(suppressions).values({
    scope: body.scope,
    agentId: body.agentId ?? null,
    sourceType: body.sourceType ?? null,
    sourceUrl: body.sourceUrl ?? null,
    reason: body.reason,
    requestedBy: body.requestedBy ?? null,
  });
  return NextResponse.json({ ok: true });
}
