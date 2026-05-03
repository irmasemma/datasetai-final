// /dashboard/verify — story E7.1 verified-publisher application form.

import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import { verificationApplications } from '@datasetai/db';
import { desc, eq } from 'drizzle-orm';
import { VerifyForm } from './VerifyForm';

export const metadata = { title: 'Verify publisher — datasetai.xyz' };

export default async function VerifyPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/github?next=/dashboard/verify');
  const db = getDb();
  if (!db) return <main>Database not configured.</main>;
  const apps = await db
    .select()
    .from(verificationApplications)
    .where(eq(verificationApplications.userId, session.userId))
    .orderBy(desc(verificationApplications.createdAt))
    .limit(5);
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Apply for verified publisher</h1>
        <p className="text-sm text-neutral-500">
          Verified publishers display a badge on their listings.
        </p>
      </header>
      <VerifyForm defaultGithub={session.githubLogin ?? ''} />
      {apps.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Your applications</h2>
          <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white text-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2">
                <span>{a.githubHandle}</span>
                <span className="text-xs text-neutral-500">{a.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
