// GitHub OAuth start (story E4.1). Redirects the user to GitHub with our client id; on callback
// we exchange code -> access token -> user, upsert the user row, mint a session row, set cookie.
//
// Required env: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_BASE_URL.
// Scopes: read:user user:email — no write/repo scopes per E4.1 acceptance.

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = process.env['AUTH_BASE_URL'] ?? `${url.protocol}//${url.host}`;
  const clientId = process.env['GITHUB_CLIENT_ID'];
  if (!clientId) {
    return NextResponse.json(
      { error: 'GITHUB_CLIENT_ID not configured' },
      { status: 500 },
    );
  }
  const state = crypto.randomUUID();
  const callback = `${baseUrl}/api/auth/github/callback`;
  const next = url.searchParams.get('next') ?? '/publish';

  const ghUrl = new URL('https://github.com/login/oauth/authorize');
  ghUrl.searchParams.set('client_id', clientId);
  ghUrl.searchParams.set('redirect_uri', callback);
  ghUrl.searchParams.set('scope', 'read:user user:email');
  ghUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(ghUrl.toString());
  res.cookies.set('datasetai_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  res.cookies.set('datasetai_oauth_next', next, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
