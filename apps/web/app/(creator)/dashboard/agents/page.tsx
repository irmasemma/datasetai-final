// /dashboard/agents — stories E6.1 + E6.2 + E6.4 dashboard.
// Lists creator's agents with lifetime/7d/30d install counts, by-tool, and per-version totals.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listAgentsByCreatorId, installMetrics } from '@datasetai/db';
import { getSession } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

export const metadata = { title: 'Your agents — datasetai.xyz' };
export const revalidate = 60;

export default async function DashboardAgentsPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/github?next=/dashboard/agents');
  const db = getDb();
  if (!db) {
    return (
      <main>
        <h1 className="text-2xl font-bold">Your agents</h1>
        <p>Database not configured.</p>
      </main>
    );
  }

  const ownAgents = await listAgentsByCreatorId(db, session.userId);
  const metrics = await Promise.all(ownAgents.map((a) => installMetrics(db, a.id)));

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Your agents</h1>
        <p className="text-sm text-neutral-500">{ownAgents.length} listings</p>
      </header>
      {ownAgents.length === 0 && (
        <p className="text-sm text-neutral-500">
          You haven&apos;t published anything yet. <Link href="/publish" className="underline">Publish one</Link>.
        </p>
      )}
      <ul className="space-y-3">
        {ownAgents.map((a, idx) => {
          const m = metrics[idx]!;
          return (
            <li
              key={a.id}
              className="rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/agents/${a.id}`} className="text-base font-semibold hover:underline">
                    {a.name}
                  </Link>
                  <p className="text-xs text-neutral-500">{a.id}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href={`/dashboard/agents/${encodeURIComponent(a.id)}/export.csv`}
                    className="text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-200"
                  >
                    Export CSV
                  </Link>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <Stat label="Lifetime" value={m.lifetime} />
                <Stat label="30 days" value={m.last30d} />
                <Stat label="7 days" value={m.last7d} />
              </dl>
              <BreakdownByTool data={m.byTool} />
              <BreakdownByVersion data={m.byVersion} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-neutral-100 px-3 py-2 dark:bg-neutral-900">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="text-lg font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function BreakdownByTool({ data }: { data: Readonly<Record<string, number>> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mt-3 space-y-1 text-xs">
      <div className="font-medium uppercase text-neutral-500">By tool</div>
      <div className="flex h-2 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-800">
        {entries.map(([tool, count]) => (
          <div
            key={tool}
            title={`${tool}: ${count}`}
            style={{ width: `${(count / total) * 100}%` }}
            className="bg-neutral-900 first:rounded-l last:rounded-r dark:bg-neutral-100"
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-neutral-500">
        {entries.map(([tool, count]) => (
          <li key={tool}>
            {tool}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BreakdownByVersion({ data }: { data: Readonly<Record<string, number>> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className="mt-3 space-y-1 text-xs">
      <div className="font-medium uppercase text-neutral-500">By version</div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-neutral-500">
        {entries.map(([v, count]) => (
          <li key={v}>
            {v}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}
