// E6.5 CSV export. Daily install rollups for the past 90 days for an owner-permitted agent.

import { agents, installRollupDaily } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getSession } from '../../../../../../lib/auth';

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const [agent] = await db.select().from(agents).where(eq(agents.id, slug)).limit(1);
  if (!agent) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (agent.creatorId && agent.creatorId !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const rows = await installRollupDaily(db, slug, 90);
  const lines: string[] = ['date,agent_id,version,tool_detected,count'];
  for (const r of rows) {
    lines.push(
      [r.date, slug, r.version, r.tool, String(r.count)]
        .map((s) => csvEscape(String(s)))
        .join(','),
    );
  }
  const body = `${lines.join('\n')}\n`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${encodeURIComponent(slug)}-installs.csv"`,
    },
  });
}
