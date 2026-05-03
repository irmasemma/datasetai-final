// /admin/claims — review pending listing-claim requests (E5.8).

import { listClaimRequests } from '@datasetai/db';
import { requireAdminPage } from '../../../lib/admin';
import { getDb } from '../../../lib/db';

export const metadata = { title: 'Claims — admin' };

export default async function AdminClaimsPage() {
  await requireAdminPage('/admin/claims');
  const db = getDb();
  const list = db ? await listClaimRequests(db) : [];
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-bold">Pending listing claims</h1>
      <ul className="space-y-2">
        {list.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-3 rounded border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div>
              <div className="font-mono text-xs">{c.agentId}</div>
              <div className="text-xs text-neutral-500">claimer: {c.claimerUserId}</div>
              {c.githubProof && (
                <a href={c.githubProof} className="text-xs text-blue-600 underline">
                  proof
                </a>
              )}
              <div className="text-xs text-neutral-400">{c.createdAt.toISOString()}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={`/api/v1/admin/claims/${c.id}/approve`} method="post">
                <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
                  Approve
                </button>
              </form>
              <form action={`/api/v1/admin/claims/${c.id}/reject`} method="post">
                <button className="rounded border px-2 py-1 text-xs">Reject</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
