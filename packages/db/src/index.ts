// @datasetai/db — Drizzle schema, client factory, and query helpers.
// Architecture: AD-1, AD-4 (immutable AgentVersion + content-hash storage), §5.2.

export const PACKAGE = '@datasetai/db' as const;

export * from './schema.js';
export * from './client.js';
export * from './queries.js';
export { createPgliteDb } from './pglite-client.js';
