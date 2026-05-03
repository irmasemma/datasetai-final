// POST /api/v1/reports — story E7.3 (listing report flow).
// Light rate-limit: a single anonymous reporter ip / user gets 3 reports/hour, enforced via a
// per-process counter (round-2 acceptable). The form is open to anonymous reporters.

import { reports } from '@datasetai/db';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

interface Body {
  readonly agentId?: string;
  readonly reason?: string;
  readonly details?: string;
  readonly reporterEmail?: string;
}

const VALID_REASONS = new Set(['spam', 'license-violation', 'malicious-content', 'broken', 'other']);

const counters = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 3;

function rateLimitKey(req: Request, userId: string | null): string {
  if (userId) return `u:${userId}`;
  return `ip:${req.headers.get('x-forwarded-for') ?? 'anon'}`;
}

function checkLimit(key: string): boolean {
  const now = Date.now();
  const entry = counters.get(key);
  if (!entry || entry.reset < now) {
    counters.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.agentId || !body.reason || !VALID_REASONS.has(body.reason)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }
  const session = await getSession();
  const key = rateLimitKey(req, session?.userId ?? null);
  if (!checkLimit(key)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });

  await db.insert(reports).values({
    agentId: body.agentId,
    reporterUserId: session?.userId ?? null,
    reporterEmail: body.reporterEmail ?? session?.email ?? null,
    reason: body.reason,
    details: body.details ?? null,
  });
  return NextResponse.json({ ok: true });
}
