import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@datasetai/source-adapters',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    globals: false,
  },
});
