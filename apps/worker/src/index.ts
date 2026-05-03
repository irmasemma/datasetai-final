// datasetai worker — background jobs runner.
// Round 2 swap: in-process queue (no Redis). Jobs registered: publish-manifest, refresh-mirrors.
// Cron is a simple setInterval scheduler keyed off WORKER_REFRESH_INTERVAL_MS (default: 6h).

import { loadEnv } from '@datasetai/config';
import {
  PROJECT_NAME,
  createInMemoryQueue,
  createLocalFsStorage,
  generateKeypair,
  type ContentStorage,
  type JobQueue,
} from '@datasetai/core';
import { createDb, type Database } from '@datasetai/db';
import {
  createAlirezarezvaniAdapter,
  createPromptsChatAdapter,
  createSmitheryAdapter,
  createVoltAgentAdapter,
} from '@datasetai/source-adapters';
import {
  PUBLISH_MANIFEST_JOB,
  createPublishManifestHandler,
  type PublishManifestPayload,
} from './jobs/publish-manifest.js';
import { REFRESH_MIRRORS_JOB, refreshMirrors } from './jobs/refresh-mirrors.js';

export interface WorkerDeps {
  readonly db: Database;
  readonly storage: ContentStorage;
  readonly queue: JobQueue;
  readonly signingKey: Uint8Array;
  readonly keyId: string;
  readonly publicCdnBase: string;
}

export function registerJobs(deps: WorkerDeps): void {
  deps.queue.process<PublishManifestPayload>(
    PUBLISH_MANIFEST_JOB,
    createPublishManifestHandler({
      db: deps.db,
      storage: deps.storage,
      signingKey: deps.signingKey,
      keyId: deps.keyId,
      publicCdnBase: deps.publicCdnBase,
    }),
  );

  deps.queue.process(REFRESH_MIRRORS_JOB, async () => {
    await refreshMirrors({
      db: deps.db,
      adapters: [
        createVoltAgentAdapter(),
        createAlirezarezvaniAdapter(),
        createPromptsChatAdapter(),
        ...(process.env['SMITHERY_REGISTRY_URL'] ? [createSmitheryAdapter()] : []),
      ],
      contentBaseUrl: deps.publicCdnBase,
    });
  });
}

export interface CronOptions {
  readonly intervalMs: number;
  readonly queue: JobQueue;
}

export function startMirrorCron(opts: CronOptions): { stop: () => void } {
  const handle = setInterval(() => {
    void opts.queue.enqueue(REFRESH_MIRRORS_JOB, {});
  }, opts.intervalMs);
  // Don't keep the event loop alive solely for the cron during tests.
  if (typeof handle === 'object' && handle !== null && 'unref' in handle) {
    (handle as { unref: () => void }).unref();
  }
  return {
    stop: () => clearInterval(handle),
  };
}

export async function main(): Promise<void> {
  const env = loadEnv();
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.log(
      `[${PROJECT_NAME}] worker boot — DATABASE_URL not set; staying idle (NODE_ENV=${env.NODE_ENV})`,
    );
    return;
  }
  const { db } = createDb({ url: databaseUrl });
  const storage = createLocalFsStorage({
    rootDir: process.env['CONTENT_DIR'] ?? './var/content',
    publicBaseUrl: process.env['CONTENT_PUBLIC_URL'] ?? 'https://cdn.datasetai.xyz',
  });
  const { privateKey, publicKey } = generateKeypair();
  void publicKey;
  const queue = createInMemoryQueue({ maxAttempts: 3 });
  registerJobs({
    db,
    storage,
    queue,
    signingKey: privateKey,
    keyId: process.env['MANIFEST_KEY_ID'] ?? 'dev-key-1',
    publicCdnBase: process.env['CONTENT_PUBLIC_URL'] ?? 'https://cdn.datasetai.xyz',
  });

  const intervalMs = Number(process.env['WORKER_REFRESH_INTERVAL_MS'] ?? 6 * 60 * 60 * 1000);
  startMirrorCron({ intervalMs, queue });
  console.log(`[${PROJECT_NAME}] worker boot OK — interval=${intervalMs}ms`);
}

const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMain) {
  void main();
}

export { PUBLISH_MANIFEST_JOB, REFRESH_MIRRORS_JOB };
export type { PublishManifestPayload };
export { createPublishManifestHandler } from './jobs/publish-manifest.js';
export { refreshMirrors } from './jobs/refresh-mirrors.js';
