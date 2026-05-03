// Server-only admin guard. Throws redirect when not admin.

import { redirect } from 'next/navigation';
import { getSession } from './auth';

export async function requireAdminPage(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/api/auth/github?next=${encodeURIComponent(returnTo)}`);
  if (!session.isAdmin) redirect('/');
  return session;
}

export async function requireAdminApi(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401, error: 'AUTH_REQUIRED' };
  if (!session.isAdmin) return { ok: false, status: 403, error: 'ADMIN_REQUIRED' };
  return { ok: true, userId: session.userId };
}
