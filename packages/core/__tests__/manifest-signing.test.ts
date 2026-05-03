// Tests for Story E1.4b — Manifest Signing + CLI Signature Verification.
// Architecture: AR-6, Open Architectural Question §7 Q7 (resolved 2026-05-02).
//
// Covers AC: valid sig accepts; tampered manifest rejects; missing sig rejects;
// key-rotation overlap window accepts both old + new keys.

import { describe, expect, it } from 'vitest';
import {
  signManifest,
  verifyManifest,
  verifyManifestWithKeyset,
  generateKeypair,
  activeVerificationKeys,
  canonicalize,
  type VerificationKey,
} from '@datasetai/core';
import type { UnsignedManifest } from '@datasetai/core';

function fixtureManifest(overrides: Partial<UnsignedManifest> = {}): UnsignedManifest {
  return {
    schemaVersion: 1,
    id: 'voltagent/code-reviewer',
    version: '1.0.0',
    name: 'Code Reviewer',
    description: 'Reviews code',
    format: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code'],
    contentUrl: 'https://cdn.datasetai.xyz/content/abc.tar.gz',
    contentHash: 'sha256-abc',
    contentSize: 1024,
    publishedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('manifest signing (Story E1.4b)', () => {
  it('valid Ed25519 signature roundtrips: sign → verify accepts', () => {
    const { privateKey, publicKey } = generateKeypair();
    const signed = signManifest(fixtureManifest(), privateKey, 'k1');
    expect(typeof signed.signature).toBe('string');
    expect(signed.keyId).toBe('k1');
    const result = verifyManifest(signed, publicKey);
    expect(result.ok).toBe(true);
  });

  it('tampered manifest is rejected with MANIFEST_SIGNATURE_INVALID', () => {
    const { privateKey, publicKey } = generateKeypair();
    const signed = signManifest(fixtureManifest(), privateKey, 'k1');
    // Mutate the version after signing.
    const tampered = { ...signed, version: '2.0.0' };
    const result = verifyManifest(tampered, publicKey);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MANIFEST_SIGNATURE_INVALID');
    }
  });

  it('manifest with missing signature is rejected with MANIFEST_SIGNATURE_MISSING', () => {
    const { publicKey } = generateKeypair();
    const unsigned = fixtureManifest();
    const result = verifyManifest(unsigned, publicKey);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MANIFEST_SIGNATURE_MISSING');
    }
  });

  it('verification with the wrong public key is rejected', () => {
    const signing = generateKeypair();
    const other = generateKeypair();
    const signed = signManifest(fixtureManifest(), signing.privateKey, 'k1');
    const result = verifyManifest(signed, other.publicKey);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MANIFEST_SIGNATURE_INVALID');
    }
  });

  it('keyset verification accepts manifest signed with old key during overlap', () => {
    const oldKp = generateKeypair();
    const newKp = generateKeypair();
    const oldKey: VerificationKey = { keyId: 'old', publicKey: oldKp.publicKey };
    const newKey: VerificationKey = { keyId: 'new', publicKey: newKp.publicKey };

    const oldSigned = signManifest(fixtureManifest(), oldKp.privateKey, 'old');
    const newSigned = signManifest(fixtureManifest(), newKp.privateKey, 'new');

    const bundle = [newKey, oldKey];
    expect(verifyManifestWithKeyset(oldSigned, bundle).ok).toBe(true);
    expect(verifyManifestWithKeyset(newSigned, bundle).ok).toBe(true);
  });

  it('keyset verification rejects unknown keyId with MANIFEST_KEY_UNKNOWN', () => {
    const kp = generateKeypair();
    const signed = signManifest(fixtureManifest(), kp.privateKey, 'rogue');
    const result = verifyManifestWithKeyset(signed, [
      { keyId: 'current', publicKey: kp.publicKey },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MANIFEST_KEY_UNKNOWN');
    }
  });

  it('activeVerificationKeys honors the 30-day overlap window', () => {
    const oldKp = generateKeypair();
    const newKp = generateKeypair();
    const window = {
      currentKey: { keyId: 'new', publicKey: newKp.publicKey },
      previousKey: { keyId: 'old', publicKey: oldKp.publicKey },
      previousKeyExpiresAt: new Date('2026-06-01T00:00:00Z'),
    };
    const duringOverlap = activeVerificationKeys(window, new Date('2026-05-15T00:00:00Z'));
    const afterOverlap = activeVerificationKeys(window, new Date('2026-06-15T00:00:00Z'));
    expect(duringOverlap).toHaveLength(2);
    expect(afterOverlap).toHaveLength(1);
    expect(afterOverlap[0]?.keyId).toBe('new');
  });

  it('canonicalize is stable across key ordering', () => {
    const a = canonicalize({ b: 1, a: 2 });
    const b = canonicalize({ a: 2, b: 1 });
    expect(a).toBe(b);
  });
});
