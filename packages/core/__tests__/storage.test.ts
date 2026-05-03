// Tests for Story E4.5 — Immutable AgentVersion + Content-Hash Storage.
// Real LocalFsStorage against an isolated tmpdir. Round-trips put/get/has,
// asserts dedup-on-hash and that manifest writes go to the expected paths.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createLocalFsStorage, type ContentStorage } from '@datasetai/core';

describe('LocalFsStorage (Story E4.5)', () => {
  let rootDir: string;
  let storage: ContentStorage;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'datasetai-storage-'));
    storage = createLocalFsStorage({
      rootDir,
      publicBaseUrl: 'https://cdn.test.local',
    });
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it('putContent stores bytes keyed by content hash and getContent round-trips', async () => {
    const bytes = new Uint8Array(Buffer.from('agent tarball bytes', 'utf8'));
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    const result = await storage.putContent(hash, bytes);

    expect(result.key).toBe(`content/${hash}.tar.gz`);
    expect(result.url).toBe(`https://cdn.test.local/content/${hash}.tar.gz`);
    expect(result.bytes).toBe(bytes.byteLength);

    const fetched = await storage.getContent(hash);
    expect(fetched).not.toBeNull();
    expect(Buffer.from(fetched!).toString('utf8')).toBe('agent tarball bytes');
  });

  it('has() returns false before putContent and true after — enables dedup', async () => {
    const bytes = new Uint8Array(Buffer.from('dedup-bytes', 'utf8'));
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');

    expect(await storage.has(hash)).toBe(false);
    await storage.putContent(hash, bytes);
    expect(await storage.has(hash)).toBe(true);
  });

  it('putContent is idempotent — re-uploading the same hash overwrites with identical bytes', async () => {
    const bytes = new Uint8Array(Buffer.from('idempotent', 'utf8'));
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    await storage.putContent(hash, bytes);
    await storage.putContent(hash, bytes); // re-upload; must not throw
    const fetched = await storage.getContent(hash);
    expect(Buffer.from(fetched!).equals(Buffer.from(bytes))).toBe(true);
  });

  it('putManifest writes JSON to agents/<id>/<version>.json on disk', async () => {
    const json = JSON.stringify({ id: 'voltagent/code-reviewer', version: '1.0.0' });
    const result = await storage.putManifest('voltagent/code-reviewer', '1.0.0', json);

    expect(result.key).toBe('agents/voltagent/code-reviewer/1.0.0.json');
    // Read the file directly to confirm bytes hit disk.
    const onDisk = await fs.readFile(
      path.join(rootDir, 'agents', encodeURIComponent('voltagent/code-reviewer'), '1.0.0.json'),
      'utf8',
    );
    expect(JSON.parse(onDisk).version).toBe('1.0.0');
  });

  it('putLatestPointer writes latest.json to the agent dir', async () => {
    const json = JSON.stringify({ id: 'a/b', version: '2.0.0' });
    const result = await storage.putLatestPointer('a/b', json);

    expect(result.key).toBe('agents/a/b/latest.json');
    const onDisk = await fs.readFile(
      path.join(rootDir, 'agents', encodeURIComponent('a/b'), 'latest.json'),
      'utf8',
    );
    expect(JSON.parse(onDisk).version).toBe('2.0.0');
  });

  it('getContent returns null for unknown hash', async () => {
    const result = await storage.getContent('sha256-does-not-exist');
    expect(result).toBeNull();
  });
});
