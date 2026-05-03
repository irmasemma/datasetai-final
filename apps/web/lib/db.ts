// Server-side Database singleton. Gracefully no-ops when DATABASE_URL is missing so the
// catalog pages still render with the in-memory fixtures (apps/web/lib/fixtures.ts).

import { createDb, type Database } from '@datasetai/db';

let cached: { db: Database; close: () => Promise<void> } | null = null;

export function getDb(): Database | null {
  const url = process.env['DATABASE_URL'];
  if (!url) return null;
  if (!cached) {
    cached = createDb({ url });
  }
  return cached.db;
}
