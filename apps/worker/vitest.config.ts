import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@datasetai/worker',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    globals: false,
  },
});
