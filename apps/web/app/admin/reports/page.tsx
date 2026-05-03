// /admin/reports — story E7.4 moderation queue.

import { listPendingReports } from '@datasetai/db';
import { requireAdminPage } from '../../../lib/admin';
import { getDb } from '../../../lib/db';

export const metadata = { title: 'Reports — admin' };

export default async function AdminReportsPage() {
  await requireAdminPage('/admin/reports');
  const db = getDb();
  const list = db ? await listPendingReports(db) : [];
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Pending reports</h1>
        <p className="text-sm text-neutral-500">{list.length} open</p>
      </header>
      <ul className="space-y-2">
        {list.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-4 rounded border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div>
              <div className="font-mono text-xs text-neutral-500">{r.agentId}</div>
              <div className="font-medium">{r.reason}</div>
              {r.details && <p className="text-xs text-neutral-500">{r.details}</p>}
              <div className="text-xs text-neutral-400">{r.createdAt.toISOString()}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={`/api/v1/admin/reports/${r.id}/dismiss`} method="post">
                <button className="rounded border px-2 py-1 text-xs">Dismiss</button>
              </form>
              <form action={`/api/v1/admin/reports/${r.id}/suppress`} method="post">
                <button className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white">
                  Suppress
                </button>
              </form>
              <form action={`/api/v1/admin/reports/${r.id}/remove`} method="post">
                <button className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
                  Take down
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
