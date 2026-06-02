// Server-side Database singleton. Uses real Postgres when DATABASE_URL is set, otherwise
// the catalog layer falls back to fixtures (which include mirrored data when available).

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
