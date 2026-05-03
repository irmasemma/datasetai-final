// Server-only auth helper. Reads the session cookie, resolves it against the `sessions` table,
// returns an AuthSession compatible with @datasetai/core. We deliberately keep this minimal:
// a real Auth.js v5 wiring is feature-gated below by AUTH_PROVIDER (defaults to dev cookie).

import {
  SESSION_COOKIE,
  type AuthSession,
  type SessionStore,
} from '@datasetai/core';
import {
  findUserById,
  sessions,
  type Database,
} from '@datasetai/db';
import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb } from './db';

export function createSessionStore(db: Database): SessionStore {
  return {
    async resolve(sessionId) {
      const [row] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
        .limit(1);
      if (!row) return null;
      const user = await findUserById(db, row.userId);
      if (!user) return null;
      return {
        userId: user.id,
        githubLogin: user.githubLogin,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerifiedPublisher: user.isVerifiedPublisher,
      };
    },
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const db = getDb();
  if (!db) return getDevSession();
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const store = createSessionStore(db);
  return store.resolve(sid);
}

// Dev convenience: a `DEV_AUTH_USER_ID` env var pretends to be a logged-in user when DATABASE_URL
// is absent. Used purely to keep dev/local previews of /publish and /dashboard navigable.
function getDevSession(): AuthSession | null {
  const id = process.env['DEV_AUTH_USER_ID'];
  if (!id) return null;
  return {
    userId: id,
    githubLogin: process.env['DEV_AUTH_LOGIN'] ?? 'dev-user',
    email: process.env['DEV_AUTH_EMAIL'] ?? 'dev@datasetai.xyz',
    isAdmin: process.env['DEV_AUTH_IS_ADMIN'] === 'true',
    isVerifiedPublisher: process.env['DEV_AUTH_IS_VERIFIED'] === 'true',
  };
}
