// Process-singleton in-memory queue + storage + signing key for the web app.
// In production the worker process owns these; the web app enqueues. Round 2 acceptable
// trade-off: with the in-memory queue we share a singleton inside the Next process.

import {
  createInMemoryQueue,
  createLocalFsStorage,
  generateKeypair,
  type ContentStorage,
  type JobQueue,
} from '@datasetai/core';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface Bundle {
  readonly storage: ContentStorage;
  readonly queue: JobQueue;
  readonly signingKey: Uint8Array;
  readonly keyId: string;
  readonly publicCdnBase: string;
}

let cached: Bundle | null = null;

export function getWorkerBundle(): Bundle {
  if (cached) return cached;
  const rootDir = process.env['CONTENT_DIR'] ?? path.join(tmpdir(), 'datasetai-content');
  const publicCdnBase =
    process.env['CONTENT_PUBLIC_URL'] ?? `file://${rootDir.replace(/\\/g, '/')}`;
  const storage = createLocalFsStorage({ rootDir, publicBaseUrl: publicCdnBase });
  const queue = createInMemoryQueue({ maxAttempts: 3 });
  const { privateKey } = generateKeypair();
  cached = {
    storage,
    queue,
    signingKey: privateKey,
    keyId: process.env['MANIFEST_KEY_ID'] ?? 'web-runtime-1',
    publicCdnBase,
  };
  return cached;
}
