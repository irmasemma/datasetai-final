// /publish — story E4.2 web upload form.
// Server component that gates against session + ToS acceptance, then renders the client form.

import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { findUserById } from '@datasetai/db';
import { ALLOWED_LICENSES } from '@datasetai/format-adapters';
import { PublishForm } from './PublishForm';
import { TosForm } from './TosForm';

export const metadata = { title: 'Publish — datasetai.xyz' };

export default async function PublishPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/github?next=/publish');
  const db = getDb();
  if (!db) {
    return (
      <main className="prose dark:prose-invert">
        <h1>Publish</h1>
        <p>Database is not configured. Set DATABASE_URL to enable publishing.</p>
      </main>
    );
  }
  const user = await findUserById(db, session.userId);
  if (!user) redirect('/api/auth/github?next=/publish');

  const needsTos =
    !user.acceptedTosAt || !user.acceptedPrivacyAt || !user.acceptedCreatorAgreementAt;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Publish an agent</h1>
        <p className="text-neutral-500">
          Upload your Claude Skill, MCP server, or system prompt. We auto-detect the format and
          run a publish-time linter.
        </p>
      </header>
      {needsTos ? (
        <TosForm
          accepted={{
            tos: !!user.acceptedTosAt,
            privacy: !!user.acceptedPrivacyAt,
            creator: !!user.acceptedCreatorAgreementAt,
          }}
        />
      ) : (
        <PublishForm licenses={ALLOWED_LICENSES} />
      )}
    </main>
  );
}
