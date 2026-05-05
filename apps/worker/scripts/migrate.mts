// Apply drizzle migrations against $DATABASE_URL.
// Usage: DATABASE_URL=... pnpm exec tsx apps/worker/scripts/migrate.mts

import { runMigrations } from '../../../packages/db/src/migrate.js';

const url = process.env['DATABASE_URL'];
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
await runMigrations({ url });
console.log('Migrations applied.');
