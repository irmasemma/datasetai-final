// /admin/suppressions — story E5.9 admin UI.

import { listSuppressions } from '@datasetai/db';
import { requireAdminPage } from '../../../lib/admin';
import { getDb } from '../../../lib/db';
import { SuppressionForm } from './SuppressionForm';

export const metadata = { title: 'Suppressions — admin' };

export default async function AdminSuppressionsPage() {
  await requireAdminPage('/admin/suppressions');
  const db = getDb();
  const list = db ? await listSuppressions(db) : [];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Suppressions</h1>
        <p className="text-sm text-neutral-500">
          Suppressed agents are hidden from the catalog and skipped on mirror refresh.
        </p>
      </header>
      <SuppressionForm />
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr>
            <th className="py-2">Status</th>
            <th>Scope</th>
            <th>Agent ID</th>
            <th>Reason</th>
            <th>Requested by</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {list.map((s) => (
            <tr key={s.id}>
              <td className="py-2">{s.status}</td>
              <td>{s.scope}</td>
              <td className="font-mono text-xs">{s.agentId}</td>
              <td>{s.reason}</td>
              <td>{s.requestedBy ?? '—'}</td>
              <td className="text-xs text-neutral-500">{s.createdAt.toISOString().slice(0, 10)}</td>
              <td>
                {s.status === 'active' && (
                  <form action={`/api/v1/admin/suppressions/${s.id}/resolve`} method="post">
                    <button type="submit" className="text-xs underline">
                      Resolve
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
