// Migration runner. Run via `pnpm -F @datasetai/db migrate` after generating with drizzle-kit.

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createDb } from './client.js';

export interface RunMigrationsOptions {
  readonly url: string;
  readonly migrationsFolder?: string;
}

export async function runMigrations(options: RunMigrationsOptions): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const folder = options.migrationsFolder ?? join(here, '..', 'drizzle');
  const { db, close } = createDb({ url: options.url, max: 1 });
  try {
    await db.execute('CREATE EXTENSION IF NOT EXISTS citext' as unknown as never);
    await migrate(db, { migrationsFolder: folder });
  } finally {
    await close();
  }
}

const isMain =
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/') ?? ''}`;
if (isMain) {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  await runMigrations({ url });
  console.log('Migrations applied.');
  process.exit(0);
}
