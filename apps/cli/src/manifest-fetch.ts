// Manifest + content fetching from CDN. Pure DI: every network call goes through `fetchFn`
// so tests can mock with an in-memory map.

import { createHash } from 'node:crypto';
import type { SignedManifest } from '@datasetai/core';
import {
  isSignedManifest,
  verifyManifestWithKeyset,
  type VerificationKey,
} from '@datasetai/core';

export interface FetchDeps {
  readonly fetch: typeof fetch;
  readonly cdnBaseUrl: string;
  readonly verificationKeys: readonly VerificationKey[];
}

export type FetchManifestError =
  | { code: 'MANIFEST_NOT_FOUND'; agentId: string; version: string }
  | { code: 'MANIFEST_PARSE_ERROR'; details: string }
  | { code: 'MANIFEST_SIGNATURE_MISSING' }
  | { code: 'MANIFEST_KEY_UNKNOWN'; keyId: string }
  | { code: 'MANIFEST_SIGNATURE_INVALID'; keyId: string };

export function manifestUrl(deps: FetchDeps, agentId: string, version: string): string {
  return `${deps.cdnBaseUrl.replace(/\/$/, '')}/agents/${encodeURIComponent(agentId)}/${encodeURIComponent(version)}.json`;
}

export async function fetchManifest(
  deps: FetchDeps,
  agentId: string,
  version: string,
): Promise<{ ok: true; manifest: SignedManifest } | { ok: false; error: FetchManifestError }> {
  const url = manifestUrl(deps, agentId, version);
  const response = await deps.fetch(url);
  if (response.status === 404) {
    return { ok: false, error: { code: 'MANIFEST_NOT_FOUND', agentId, version } };
  }
  if (!response.ok) {
    return { ok: false, error: { code: 'MANIFEST_PARSE_ERROR', details: `HTTP ${response.status}` } };
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (e) {
    return {
      ok: false,
      error: { code: 'MANIFEST_PARSE_ERROR', details: e instanceof Error ? e.message : String(e) },
    };
  }
  if (!isSignedManifest(parsed)) {
    return { ok: false, error: { code: 'MANIFEST_SIGNATURE_MISSING' } };
  }
  const verified = verifyManifestWithKeyset(parsed, deps.verificationKeys);
  if (!verified.ok) {
    return { ok: false, error: verified.error };
  }
  return { ok: true, manifest: verified.manifest };
}

export type FetchContentError =
  | { code: 'CONTENT_NOT_FOUND'; url: string }
  | { code: 'CONTENT_FETCH_ERROR'; details: string }
  | { code: 'CONTENT_HASH_MISMATCH'; expected: string; actual: string };

export async function fetchContent(
  deps: Pick<FetchDeps, 'fetch'>,
  manifest: SignedManifest,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; error: FetchContentError }> {
  const response = await deps.fetch(manifest.contentUrl);
  if (response.status === 404) {
    return { ok: false, error: { code: 'CONTENT_NOT_FOUND', url: manifest.contentUrl } };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'CONTENT_FETCH_ERROR', details: `HTTP ${response.status}` },
    };
  }
  const buf = new Uint8Array(await response.arrayBuffer());
  const hash = createHash('sha256').update(buf).digest('hex');
  if (hash !== manifest.contentHash) {
    return {
      ok: false,
      error: { code: 'CONTENT_HASH_MISMATCH', expected: manifest.contentHash, actual: hash },
    };
  }
  return { ok: true, bytes: buf };
}
