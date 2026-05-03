// /agents/[slug]/claim — story E5.8 claim flow.
// Submits a row to claim_requests; admin approves manually via /admin/claims.

import { agents } from '@datasetai/db';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getDb } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { ClaimForm } from './ClaimForm';

export const metadata = { title: 'Claim listing — datasetai.xyz' };

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect(`/api/auth/github?next=/agents/${encodeURIComponent(slug)}/claim`);
  const db = getDb();
  if (!db) return <main>Database not configured.</main>;
  const [agent] = await db.select().from(agents).where(eq(agents.id, slug)).limit(1);
  if (!agent) notFound();
  if (agent.creatorId) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-bold">Already claimed</h1>
        <p className="text-neutral-500">This listing already has an owner.</p>
      </main>
    );
  }
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Claim {agent.name}</h1>
        <p className="text-sm text-neutral-500">
          We&apos;ll verify your GitHub ownership against {agent.sourceUrl ?? 'the upstream'} before
          transferring control.
        </p>
      </header>
      <ClaimForm slug={slug} />
    </main>
  );
}
