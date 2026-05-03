import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@datasetai/db',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    // pglite spins up an in-memory Postgres per test file; allow generous timeout.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    globals: false,
  },
});
