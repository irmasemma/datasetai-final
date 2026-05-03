// Ed25519 manifest signing/verification (Architecture AR-6 mitigation, story E1.4b).
// Manifests are signed with the platform's private key; the CLI hard-fails if the signature
// is missing or invalid. A 30-day key-rotation overlap is supported by verifyManifestWithKeyset.
//
// Storage: the private key lives ONLY in vendor-managed secrets (Vercel/Fly env). Never in code.
//
// Wire format: signature is a Base64-encoded Ed25519 sig over the canonicalized JSON of the
// manifest with `signature` and `keyId` removed. The canonicalization is: sort keys alphabetically,
// no extra whitespace.

import * as ed25519 from '@noble/ed25519';
import { createHash, randomBytes } from 'node:crypto';
import {
  isSignedManifest,
  type SignedManifest,
  type UnsignedManifest,
} from './manifest.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ed25519 as any).hashes.sha512 = (msg: Uint8Array): Uint8Array => {
  const h = createHash('sha512');
  h.update(msg);
  return new Uint8Array(h.digest());
};

export const MANIFEST_SIGNATURE_INVALID = 'MANIFEST_SIGNATURE_INVALID';

export interface VerificationKey {
  readonly keyId: string;
  readonly publicKey: Uint8Array;
}

export type ManifestVerificationError =
  | { readonly code: 'MANIFEST_SIGNATURE_MISSING' }
  | { readonly code: 'MANIFEST_KEY_UNKNOWN'; readonly keyId: string }
  | { readonly code: 'MANIFEST_SIGNATURE_INVALID'; readonly keyId: string };

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const body = keys
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(',');
  return `{${body}}`;
}

function manifestSigningPayload(manifest: UnsignedManifest): Uint8Array {
  const canonical = canonicalize(manifest);
  return new TextEncoder().encode(canonical);
}

export function signManifest(
  manifest: UnsignedManifest,
  privateKey: Uint8Array,
  keyId: string,
): SignedManifest {
  if (privateKey.length !== 32) {
    throw new Error('Ed25519 private key must be 32 bytes');
  }
  const payload = manifestSigningPayload(manifest);
  const sig = ed25519.sign(payload, privateKey);
  return {
    ...manifest,
    signature: Buffer.from(sig).toString('base64'),
    keyId,
  };
}

export function verifyManifest(
  manifest: unknown,
  publicKey: Uint8Array,
): { ok: true; manifest: SignedManifest } | { ok: false; error: ManifestVerificationError } {
  if (!isSignedManifest(manifest)) {
    return { ok: false, error: { code: 'MANIFEST_SIGNATURE_MISSING' } };
  }
  return verifyAgainstKey(manifest, publicKey, manifest.keyId);
}

function verifyAgainstKey(
  manifest: SignedManifest,
  publicKey: Uint8Array,
  keyId: string,
):
  | { ok: true; manifest: SignedManifest }
  | { ok: false; error: ManifestVerificationError } {
  const { signature, keyId: _keyId, ...rest } = manifest;
  void _keyId;
  const payload = manifestSigningPayload(rest as UnsignedManifest);
  const sigBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
  let valid = false;
  try {
    valid = ed25519.verify(sigBytes, payload, publicKey);
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, error: { code: 'MANIFEST_SIGNATURE_INVALID', keyId } };
  return { ok: true, manifest };
}

/**
 * Verify against a keyset. Supports the 30-day key-rotation overlap window: the CLI ships
 * with the current and (optionally) the previous public key; either is accepted.
 */
export function verifyManifestWithKeyset(
  manifest: unknown,
  keys: readonly VerificationKey[],
): { ok: true; manifest: SignedManifest } | { ok: false; error: ManifestVerificationError } {
  if (!isSignedManifest(manifest)) {
    return { ok: false, error: { code: 'MANIFEST_SIGNATURE_MISSING' } };
  }
  const matchingKey = keys.find((k) => k.keyId === manifest.keyId);
  if (!matchingKey) {
    return { ok: false, error: { code: 'MANIFEST_KEY_UNKNOWN', keyId: manifest.keyId } };
  }
  return verifyAgainstKey(manifest, matchingKey.publicKey, matchingKey.keyId);
}

export function generateKeypair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = new Uint8Array(randomBytes(32));
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export interface KeyRotationWindow {
  readonly currentKey: VerificationKey;
  readonly previousKey?: VerificationKey;
  readonly previousKeyExpiresAt: Date;
}

/**
 * Build a keyset honoring the 30-day overlap. Past expiry the previous key is dropped.
 * Used by the CLI's bundled key registry.
 */
export function activeVerificationKeys(
  window: KeyRotationWindow,
  now: Date = new Date(),
): readonly VerificationKey[] {
  if (window.previousKey && now.getTime() < window.previousKeyExpiresAt.getTime()) {
    return [window.currentKey, window.previousKey];
  }
  return [window.currentKey];
}
