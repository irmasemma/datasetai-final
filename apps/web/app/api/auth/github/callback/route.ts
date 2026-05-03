// GitHub OAuth callback. Exchanges code for an access token, fetches the GitHub user, upserts
// into `users`, mints a `sessions` row, and sets the session cookie.

import { SESSION_COOKIE } from '@datasetai/core';
import { findUserByGithubId, sessions, users } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = req.headers.get('cookie')?.match(/datasetai_oauth_state=([^;]+)/)?.[1];
  const next =
    req.headers.get('cookie')?.match(/datasetai_oauth_next=([^;]+)/)?.[1] ?? '/publish';

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.json({ error: 'state mismatch' }, { status: 400 });
  }

  const clientId = process.env['GITHUB_CLIENT_ID'];
  const clientSecret = process.env['GITHUB_CLIENT_SECRET'];
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'github oauth not configured' }, { status: 500 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'token exchange failed' }, { status: 502 });
  }
  const tokenBody = (await tokenRes.json()) as { access_token?: string };
  const token = tokenBody.access_token;
  if (!token) return NextResponse.json({ error: 'no access_token' }, { status: 502 });

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!userRes.ok) {
    return NextResponse.json({ error: 'github user fetch failed' }, { status: 502 });
  }
  const ghUser = (await userRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    email: string | null;
  };

  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  let primaryEmail: string | null = ghUser.email;
  if (emailRes.ok) {
    const list = (await emailRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
    primaryEmail =
      list.find((e) => e.primary && e.verified)?.email ?? primaryEmail ?? list[0]?.email ?? null;
  }
  if (!primaryEmail) primaryEmail = `${ghUser.login}@users.noreply.github.com`;

  const db = getDb();
  if (!db) return NextResponse.json({ error: 'db not configured' }, { status: 500 });

  const existing = await findUserByGithubId(db, ghUser.id);
  let userId: string;
  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        githubLogin: ghUser.login,
        displayName: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio,
      })
      .where(eq(users.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        email: primaryEmail,
        githubId: ghUser.id,
        githubLogin: ghUser.login,
        displayName: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio ?? null,
      })
      .returning({ id: users.id });
    userId = inserted!.id;
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

  const dest = new URL(next.startsWith('/') ? next : '/publish', url.origin);
  const res = NextResponse.redirect(dest.toString());
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  res.cookies.delete('datasetai_oauth_state');
  res.cookies.delete('datasetai_oauth_next');
  return res;
}
