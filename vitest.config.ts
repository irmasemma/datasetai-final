// Root Vitest workspace config — runs all per-package vitest configs.
// Per-package configs choose their own environment (jsdom for web, node for cli/db/core).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/web/vitest.config.ts',
      'apps/cli/vitest.config.ts',
      'apps/worker/vitest.config.ts',
      'packages/db/vitest.config.ts',
      'packages/core/vitest.config.ts',
      'packages/format-adapters/vitest.config.ts',
      'packages/source-adapters/vitest.config.ts',
    ],
  },
});
