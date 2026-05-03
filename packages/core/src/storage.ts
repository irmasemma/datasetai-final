// Pluggable content storage for publish/mirror flows.
// Architecture AD-4 (content-addressable). LocalFsStorage works against any tmpdir — used in
// tests and local dev. R2Storage is a deferred adapter that throws until wired to vendor secrets.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface StoragePutResult {
  readonly key: string;
  readonly url: string;
  readonly bytes: number;
}

export interface ContentStorage {
  /** True if an object with this content hash already exists. */
  has(contentHash: string): Promise<boolean>;
  /** Upload tarball bytes. Idempotent on contentHash. */
  putContent(contentHash: string, bytes: Uint8Array): Promise<StoragePutResult>;
  /** Upload a JSON manifest, served with immutable cache. */
  putManifest(agentId: string, version: string, json: string): Promise<StoragePutResult>;
  /** Promote a version to `latest.json`. */
  putLatestPointer(agentId: string, json: string): Promise<StoragePutResult>;
  /** Fetch raw content bytes (used by tests + the worker fallback path). */
  getContent(contentHash: string): Promise<Uint8Array | null>;
}

export interface LocalFsStorageOptions {
  readonly rootDir: string;
  readonly publicBaseUrl?: string;
}

export function createLocalFsStorage(opts: LocalFsStorageOptions): ContentStorage {
  const baseUrl = opts.publicBaseUrl ?? `file://${opts.rootDir.replace(/\\/g, '/')}`;
  const contentDir = path.join(opts.rootDir, 'content');
  const manifestDir = path.join(opts.rootDir, 'agents');

  const ensureDir = async (dir: string) => fs.mkdir(dir, { recursive: true });

  const contentPath = (hash: string) => path.join(contentDir, `${hash}.tar.gz`);

  return {
    async has(contentHash) {
      try {
        await fs.access(contentPath(contentHash));
        return true;
      } catch {
        return false;
      }
    },
    async putContent(contentHash, bytes) {
      await ensureDir(contentDir);
      const file = contentPath(contentHash);
      await fs.writeFile(file, bytes);
      return {
        key: `content/${contentHash}.tar.gz`,
        url: `${baseUrl}/content/${contentHash}.tar.gz`,
        bytes: bytes.byteLength,
      };
    },
    async putManifest(agentId, version, json) {
      const dir = path.join(manifestDir, encodeURIComponent(agentId));
      await ensureDir(dir);
      const file = path.join(dir, `${version}.json`);
      await fs.writeFile(file, json, 'utf8');
      return {
        key: `agents/${agentId}/${version}.json`,
        url: `${baseUrl}/agents/${encodeURIComponent(agentId)}/${version}.json`,
        bytes: Buffer.byteLength(json, 'utf8'),
      };
    },
    async putLatestPointer(agentId, json) {
      const dir = path.join(manifestDir, encodeURIComponent(agentId));
      await ensureDir(dir);
      const file = path.join(dir, 'latest.json');
      await fs.writeFile(file, json, 'utf8');
      return {
        key: `agents/${agentId}/latest.json`,
        url: `${baseUrl}/agents/${encodeURIComponent(agentId)}/latest.json`,
        bytes: Buffer.byteLength(json, 'utf8'),
      };
    },
    async getContent(contentHash) {
      try {
        const buf = await fs.readFile(contentPath(contentHash));
        return new Uint8Array(buf);
      } catch {
        return null;
      }
    },
  };
}

export function createR2Storage(): ContentStorage {
  const fail = (): never => {
    throw new Error(
      'R2Storage not configured — set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL',
    );
  };
  return {
    has: async () => fail(),
    putContent: async () => fail(),
    putManifest: async () => fail(),
    putLatestPointer: async () => fail(),
    getContent: async () => fail(),
  };
}
