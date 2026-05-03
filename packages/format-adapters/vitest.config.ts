import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@datasetai/format-adapters',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    globals: false,
  },
});
