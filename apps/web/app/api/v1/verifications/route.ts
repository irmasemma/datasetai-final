// POST /api/v1/verifications — story E7.1 verified-publisher application.

import { verificationApplications } from '@datasetai/db';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

interface Body {
  readonly githubHandle?: string;
  readonly reasoning?: string;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.githubHandle) return NextResponse.json({ error: 'MISSING_GITHUB' }, { status: 422 });
  await db.insert(verificationApplications).values({
    userId: session.userId,
    githubHandle: body.githubHandle,
    reasoning: body.reasoning ?? null,
  });
  return NextResponse.json({ ok: true });
}
