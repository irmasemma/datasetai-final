// Postgres client factory. Pure DI: callers pass DATABASE_URL; nothing reads env at import time.

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;

export interface CreateDbOptions {
  readonly url: string;
  readonly max?: number;
}

export function createDb(options: CreateDbOptions): {
  db: Database;
  close: () => Promise<void>;
} {
  const sql = postgres(options.url, { max: options.max ?? 10 });
  const db = drizzle(sql, { schema });
  return {
    db,
    close: () => sql.end({ timeout: 5 }),
  };
}

export { schema };
