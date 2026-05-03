// /admin/verifications — story E7.1 admin queue.

import { verificationApplications, users } from '@datasetai/db';
import { desc, eq } from 'drizzle-orm';
import { requireAdminPage } from '../../../lib/admin';
import { getDb } from '../../../lib/db';

export const metadata = { title: 'Verifications — admin' };

export default async function AdminVerificationsPage() {
  await requireAdminPage('/admin/verifications');
  const db = getDb();
  if (!db) return <div>Database not configured.</div>;
  const rows = await db
    .select({
      id: verificationApplications.id,
      githubHandle: verificationApplications.githubHandle,
      status: verificationApplications.status,
      reasoning: verificationApplications.reasoning,
      createdAt: verificationApplications.createdAt,
      userLogin: users.githubLogin,
    })
    .from(verificationApplications)
    .leftJoin(users, eq(users.id, verificationApplications.userId))
    .orderBy(desc(verificationApplications.createdAt))
    .limit(50);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Verification queue</h1>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-3 rounded border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div>
              <div className="font-semibold">{r.githubHandle}</div>
              <div className="text-xs text-neutral-500">user: {r.userLogin ?? '—'}</div>
              {r.reasoning && <p className="text-xs text-neutral-500">{r.reasoning}</p>}
              <div className="text-xs text-neutral-400">{r.status}</div>
            </div>
            {r.status === 'pending' && (
              <div className="flex shrink-0 gap-2">
                <form action={`/api/v1/admin/verifications/${r.id}/approve`} method="post">
                  <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
                    Approve
                  </button>
                </form>
                <form action={`/api/v1/admin/verifications/${r.id}/reject`} method="post">
                  <button className="rounded border px-2 py-1 text-xs">Reject</button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
