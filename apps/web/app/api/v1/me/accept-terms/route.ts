// POST /api/v1/me/accept-terms — story E4.1 ToS gate. Stamps timestamps on the user row.

import { users } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth';
import { getDb } from '../../../../../lib/db';

interface Body {
  readonly tos?: boolean;
  readonly privacy?: boolean;
  readonly creator?: boolean;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body.tos || !body.privacy || !body.creator) {
    return NextResponse.json({ error: 'ALL_THREE_REQUIRED' }, { status: 422 });
  }
  const now = new Date();
  await db
    .update(users)
    .set({
      acceptedTosAt: now,
      acceptedPrivacyAt: now,
      acceptedCreatorAgreementAt: now,
    })
    .where(eq(users.id, session.userId));
  return NextResponse.json({ ok: true });
}
