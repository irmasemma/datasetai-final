// GitHub OAuth start (story E4.1). Redirects the user to GitHub with our client id; on callback
// we exchange code -> access token -> user, upsert the user row, mint a session row, set cookie.
//
// Required env: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_BASE_URL.
// Scopes: read:user user:email — no write/repo scopes per E4.1 acceptance.

import { NextResponse } from 'next/server';

const NOT_CONFIGURED_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OAuth not configured — datasetai.xyz</title><style>html,body{margin:0;padding:0;background:#0a0a0a;color:#fafafa;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;min-height:100vh}main{max-width:32rem;margin:0 auto;padding:6rem 1.5rem}h1{font-size:1.5rem;font-weight:700;letter-spacing:-0.01em;margin:0 0 0.75rem}p{color:#a3a3a3;line-height:1.6;margin:0 0 1rem}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#171717;border:1px solid #262626;border-radius:4px;padding:0.1rem 0.4rem;font-size:0.85em;color:#22d3ee}a{display:inline-block;margin-top:1rem;color:#22d3ee;text-decoration:none;border-bottom:1px solid rgba(34,211,238,0.4)}a:hover{border-bottom-color:#22d3ee}.brand{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.75rem;letter-spacing:0.05em;text-transform:uppercase;color:#22d3ee;margin-bottom:1rem}</style></head><body><main><div class="brand">datasetai.xyz</div><h1>GitHub OAuth isn't configured here.</h1><p>This environment is missing <code>GITHUB_CLIENT_ID</code>, so publishing and the creator dashboard are temporarily unavailable. Browse and install still work fine.</p><p>If you're running this locally, set the GitHub OAuth env vars and restart the server.</p><a href="/">← Back to datasetai.xyz</a></main></body></html>`;

export async function GET(req: Request) {
  const clientId = process.env['GITHUB_CLIENT_ID'];
  if (!clientId) {
    return new Response(NOT_CONFIGURED_HTML, {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  const url = new URL(req.url);
  const baseUrl = process.env['AUTH_BASE_URL'] ?? `${url.protocol}//${url.host}`;
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
