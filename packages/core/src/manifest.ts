// Manifest types — the canonical JSON shape served at cdn.datasetai.xyz/agents/<id>/<version>.json.
// Architecture AD-4 (content-addressable), AD-5 (CLI does not depend on web), AD-2 (FormatAdapter).

import type { FormatId, ToolId } from './index.js';

export interface ManifestAttribution {
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly authorHandle?: string;
  readonly mirroredAt?: string;
}

export interface ManifestFile {
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
}

export interface UnsignedManifest {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly format: FormatId;
  readonly formats: readonly FormatId[];
  readonly toolCompatibility: readonly ToolId[];
  readonly license?: string;
  readonly contentUrl: string;
  readonly contentHash: string;
  readonly contentSize: number;
  readonly files?: readonly ManifestFile[];
  readonly attribution?: ManifestAttribution;
  readonly publishedAt: string;
}

export interface SignedManifest extends UnsignedManifest {
  readonly signature: string;
  readonly keyId: string;
}

export function isSignedManifest(m: unknown): m is SignedManifest {
  if (typeof m !== 'object' || m === null) return false;
  const r = m as Record<string, unknown>;
  return (
    typeof r['signature'] === 'string' &&
    typeof r['keyId'] === 'string' &&
    typeof r['id'] === 'string' &&
    typeof r['version'] === 'string' &&
    typeof r['contentHash'] === 'string'
  );
}
