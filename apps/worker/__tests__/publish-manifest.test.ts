// Tests for Story E4.10 — Manifest Publish Job (Async).
// Real InMemoryQueue + real LocalFsStorage + real Ed25519 signing/verification.
// The implementer's worker handler isn't wired yet, so we test the job-shaped
// handler we *would* wire — which exercises queue → sign → storage → verify.

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  createInMemoryQueue,
  createLocalFsStorage,
  generateKeypair,
  signManifest,
  verifyManifest,
  type ContentStorage,
  type JobQueue,
  type SignedManifest,
  type UnsignedManifest,
} from '@datasetai/core';

interface PublishManifestPayload {
  readonly agentId: string;
  readonly version: string;
  readonly manifest: UnsignedManifest;
  readonly privateKey: Uint8Array;
  readonly keyId: string;
}

function buildPublishManifestHandler(storage: ContentStorage) {
  return async (job: { payload: PublishManifestPayload }): Promise<void> => {
    const { agentId, version, manifest, privateKey, keyId } = job.payload;
    const signed = signManifest(manifest, privateKey, keyId);
    const json = JSON.stringify(signed);
    await storage.putManifest(agentId, version, json);
    await storage.putLatestPointer(agentId, json);
  };
}

describe('publish-manifest job (Story E4.10)', () => {
  let storageRoot: string;
  let storage: ContentStorage;
  let queue: JobQueue;

  beforeEach(async () => {
    storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'datasetai-pub-job-'));
    storage = createLocalFsStorage({ rootDir: storageRoot });
    queue = createInMemoryQueue();
  });

  afterEach(async () => {
    await fs.rm(storageRoot, { recursive: true, force: true });
  });

  it('end-to-end: enqueue → handler signs and writes manifest to storage; verify with public key', async () => {
    const { privateKey, publicKey } = generateKeypair();
    const contentBytes = new Uint8Array(Buffer.from('content', 'utf8'));
    const contentHash = createHash('sha256').update(Buffer.from(contentBytes)).digest('hex');
    const manifest: UnsignedManifest = {
      schemaVersion: 1,
      id: 'creator/agent',
      version: '1.0.0',
      name: 'Sample',
      description: 'desc',
      format: 'claude-skill',
      formats: ['claude-skill'],
      toolCompatibility: ['claude-code'],
      contentUrl: `https://cdn.test/content/${contentHash}.tar.gz`,
      contentHash,
      contentSize: contentBytes.byteLength,
      publishedAt: '2026-05-03T00:00:00Z',
    };

    queue.process('publish-manifest', buildPublishManifestHandler(storage));
    await queue.enqueue<PublishManifestPayload>('publish-manifest', {
      agentId: manifest.id,
      version: manifest.version,
      manifest,
      privateKey,
      keyId: 'k1',
    });
    await queue.drain();

    // Read back the file written by the worker.
    const manifestPath = path.join(
      storageRoot,
      'agents',
      encodeURIComponent('creator/agent'),
      '1.0.0.json',
    );
    const written = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as SignedManifest;
    expect(written.signature).toBeDefined();
    expect(written.keyId).toBe('k1');

    const result = verifyManifest(written, publicKey);
    expect(result.ok).toBe(true);

    // latest.json also written.
    const latestPath = path.join(
      storageRoot,
      'agents',
      encodeURIComponent('creator/agent'),
      'latest.json',
    );
    const latest = JSON.parse(await fs.readFile(latestPath, 'utf8'));
    expect(latest.version).toBe('1.0.0');
  });

  it('retries up to 3 attempts on transient handler failure', async () => {
    let attempts = 0;
    const flakyQueue = createInMemoryQueue({ maxAttempts: 3 });
    flakyQueue.process('publish-manifest', async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('R2 transient 503');
    });
    await flakyQueue.enqueue('publish-manifest', null);
    await flakyQueue.drain();
    expect(attempts).toBe(3);
  });

  it.todo(
    'after final retry failure, alerts on-call via Sentry — EXPECTS Sentry boundary in the job module',
  );
});
