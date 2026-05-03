// Round-2: real session lookup. The session id arrives via cookie; the caller resolves
// to a user row via an injected SessionStore. Web app wires this up at the route layer.

export interface AuthSession {
  readonly userId: string;
  readonly githubLogin: string | null;
  readonly email: string;
  readonly isAdmin: boolean;
  readonly isVerifiedPublisher: boolean;
}

export interface SessionStore {
  resolve(sessionId: string): Promise<AuthSession | null>;
}

export const SESSION_COOKIE = 'datasetai_session';

export async function auth(
  store: SessionStore,
  sessionId: string | undefined | null,
): Promise<AuthSession | null> {
  if (!sessionId) return null;
  return store.resolve(sessionId);
}

export function requireAuth(session: AuthSession | null): AuthSession {
  if (!session) {
    const e = new Error('AUTH_REQUIRED');
    (e as Error & { code: string }).code = 'AUTH_REQUIRED';
    throw e;
  }
  return session;
}

export function requireAdmin(session: AuthSession | null): AuthSession {
  const s = requireAuth(session);
  if (!s.isAdmin) {
    const e = new Error('ADMIN_REQUIRED');
    (e as Error & { code: string }).code = 'ADMIN_REQUIRED';
    throw e;
  }
  return s;
}
