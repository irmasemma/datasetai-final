// POST /api/v1/agents/[scope]/[name]/claim — story E5.8 (claim listing).
// Inserts a claim_requests row; admin reviews manually.

import { agents, claimRequests } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface Body {
  readonly proof?: string;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ scope: string; name: string }> },
): Promise<Response> {
  const { scope, name } = await ctx.params;
  const agentId = `${scope}/${name}`;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Body;
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (agent.creatorId) {
    return NextResponse.json({ error: 'ALREADY_CLAIMED' }, { status: 409 });
  }
  await db.insert(claimRequests).values({
    agentId,
    claimerUserId: session.userId,
    githubProof: body.proof ?? null,
  });
  return NextResponse.json({ ok: true });
}
