// Tests for Story E3.2 — `install` command (hot path) + E3.7 (multi-tool) +
// E3.8 (version pinning) + E1.4b (signature verify hard-fails).
//
// Strategy: stub fetch, format adapter registry, ledger, and tool detection
// via the InstallDeps DI surface in src/commands/install.ts. We sign a real
// manifest with @datasetai/core so the signature path is exercised end-to-end.

import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import {
  generateKeypair,
  signManifest,
  type SignedManifest,
  type UnsignedManifest,
  type VerificationKey,
} from '@datasetai/core';
import {
  createAdapterRegistry,
  type AdapterDeps,
  type AdapterRegistry,
} from '@datasetai/format-adapters';
import { runInstall, type InstallDeps, type InstallOptions } from '../src/commands/install.js';

// Synthesize a gzip-ed tar manually so the test is OS-agnostic and doesn't touch disk.
// The `tar` package's streaming Pack API does not expose direct in-memory entry add in v7,
// so we hand-build POSIX tar block format here.
function makeTarGz(files: Array<{ name: string; contents: string }>): Uint8Array {
  // Minimal POSIX tar block format: 512-byte headers, 512-byte aligned content.
  const blocks: Buffer[] = [];
  for (const f of files) {
    const data = Buffer.from(f.contents, 'utf8');
    const header = Buffer.alloc(512);
    header.write(f.name, 0, 100, 'utf8'); // name
    header.write('0000644 ', 100, 8, 'utf8'); // mode
    header.write('0000000 ', 108, 8, 'utf8'); // uid
    header.write('0000000 ', 116, 8, 'utf8'); // gid
    header.write(data.length.toString(8).padStart(11, '0') + ' ', 124, 12, 'utf8'); // size
    header.write('00000000000 ', 136, 12, 'utf8'); // mtime
    // checksum field initially spaces (8 bytes)
    header.write('        ', 148, 8, 'utf8');
    header.write('0', 156, 1, 'utf8'); // typeflag '0' = regular file
    header.write('ustar  ', 257, 8, 'utf8'); // magic+version (gnu tar style)
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i] ?? 0;
    header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8');
    blocks.push(header);
    blocks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) blocks.push(Buffer.alloc(pad));
  }
  // Two empty blocks signal EOF.
  blocks.push(Buffer.alloc(512), Buffer.alloc(512));
  const tarBuf = Buffer.concat(blocks);
  // gzip
  return new Uint8Array(gzipSync(tarBuf));
}

function fakeFetch(map: Map<string, { status: number; body: Uint8Array | string }>) {
  return vi.fn(async (input: string | URL | Request): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const entry = map.get(url);
    if (!entry) {
      return new Response(null, { status: 404 });
    }
    const body =
      typeof entry.body === 'string' ? entry.body : Buffer.from(entry.body);
    return new Response(body, { status: entry.status });
  });
}

function inMemoryAdapter(): {
  adapter: AdapterRegistry;
  ledgerStore: Map<string, string>;
  fsStore: Map<string, Uint8Array>;
} {
  const fsStore = new Map<string, Uint8Array>();
  const ledgerStore = new Map<string, string>();
  const adapterDeps: AdapterDeps = {
    readFile: async (p) => fsStore.get(p) ?? null,
    writeFile: async (p, c) => {
      fsStore.set(p, c);
    },
    mkdir: async () => {},
  };
  const registry = createAdapterRegistry(adapterDeps);
  return { adapter: registry, ledgerStore, fsStore };
}

function buildInstallDeps(args: {
  manifest: SignedManifest;
  contentBytes: Uint8Array;
  verificationKeys: readonly VerificationKey[];
  cdnBaseUrl?: string;
  detectedTool?: string;
  /** Version slug used in the manifest URL — defaults to 'latest'. Pass the
   * pinned version when testing version pinning. */
  manifestVersionSlug?: string;
}): {
  deps: InstallDeps;
  ledgerStore: Map<string, string>;
  fsStore: Map<string, Uint8Array>;
  fetchSpy: ReturnType<typeof vi.fn>;
} {
  const cdnBaseUrl = args.cdnBaseUrl ?? 'https://cdn.datasetai.xyz';
  const versionSlug = args.manifestVersionSlug ?? 'latest';
  const manifestUrlValue = `${cdnBaseUrl}/agents/${encodeURIComponent(args.manifest.id)}/${encodeURIComponent(versionSlug)}.json`;
  const fetchMap = new Map<
    string,
    { status: number; body: Uint8Array | string }
  >([
    [manifestUrlValue, { status: 200, body: JSON.stringify(args.manifest) }],
    [args.manifest.contentUrl, { status: 200, body: args.contentBytes }],
  ]);
  const fetchSpy = fakeFetch(fetchMap);

  const reg = inMemoryAdapter();
  const ledgerStore = reg.ledgerStore;

  const deps: InstallDeps = {
    fetch: fetchSpy as unknown as typeof fetch,
    cdnBaseUrl,
    verificationKeys: args.verificationKeys,
    cwd: '/proj',
    homeDir: '/home/u',
    adapter: {
      readFile: async (p) => reg.fsStore.get(p) ?? null,
      writeFile: async (p, c) => {
        reg.fsStore.set(p, c);
      },
      mkdir: async () => {},
    },
    ledger: {
      readFile: async (p) => ledgerStore.get(p) ?? null,
      writeFile: async (p, c) => {
        ledgerStore.set(p, c);
      },
      mkdir: async () => {},
    },
    detect: {
      cwd: '/proj',
      homeDir: '/home/u',
      exists: async (p: string) => {
        if (!args.detectedTool) return false;
        // Make detection match for the requested tool only.
        return p.includes(args.detectedTool === 'claude-code' ? '.claude' : '.cursor');
      },
    },
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    registry: reg.adapter,
  };
  return { deps, ledgerStore, fsStore: reg.fsStore, fetchSpy };
}

function buildSkillManifestAndContent(privateKey: Uint8Array, keyId: string, version = '1.0.0'): {
  signed: SignedManifest;
  contentBytes: Uint8Array;
} {
  const tarball = makeTarGz([
    { name: 'SKILL.md', contents: '---\nname: code-reviewer\ndescription: reviews\n---\n\n# x' },
  ]);
  const contentHash = createHash('sha256').update(Buffer.from(tarball)).digest('hex');
  const unsigned: UnsignedManifest = {
    schemaVersion: 1,
    id: 'voltagent/code-reviewer',
    version,
    name: 'Code Reviewer',
    description: 'reviews',
    format: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code'],
    contentUrl: `https://cdn.datasetai.xyz/content/${contentHash}.tar.gz`,
    contentHash,
    contentSize: tarball.byteLength,
    publishedAt: '2026-05-01T00:00:00.000Z',
  };
  const signed = signManifest(unsigned, privateKey, keyId);
  return { signed, contentBytes: tarball };
}

describe('install command (Stories E3.2 + E3.7 + E3.8 + E1.4b)', () => {
  it('happy path: valid signature → manifest fetched, tarball verified, adapter installs', async () => {
    const { privateKey, publicKey } = generateKeypair();
    const { signed, contentBytes } = buildSkillManifestAndContent(privateKey, 'k1');
    const { deps, fsStore, ledgerStore, fetchSpy } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey }],
      detectedTool: 'claude-code',
    });

    const opts: InstallOptions = { spec: 'voltagent/code-reviewer' };
    const result = await runInstall(opts, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.results.every((r) => r.success)).toBe(true);
    expect(result.summary.results.length).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // manifest + tarball
    // Adapter wrote SKILL.md somewhere under .claude/skills/code-reviewer.
    const writtenPaths = Array.from(fsStore.keys());
    expect(writtenPaths.some((p) => p.includes('.claude') && p.includes('code-reviewer'))).toBe(
      true,
    );
    // Ledger updated.
    expect(ledgerStore.size).toBeGreaterThan(0);
  });

  it('hard-fails with MANIFEST_SIGNATURE_INVALID when key set does not contain signing key', async () => {
    const signing = generateKeypair();
    const trusted = generateKeypair(); // different keypair entirely
    const { signed, contentBytes } = buildSkillManifestAndContent(signing.privateKey, 'rogue');
    const { deps } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey: trusted.publicKey }],
      detectedTool: 'claude-code',
    });

    const result = await runInstall({ spec: 'voltagent/code-reviewer' }, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Either MANIFEST_KEY_UNKNOWN (because keyId doesn't match) or MANIFEST_SIGNATURE_INVALID.
    expect(['MANIFEST_KEY_UNKNOWN', 'MANIFEST_SIGNATURE_INVALID']).toContain(result.error.code);
  });

  it('hard-fails with MANIFEST_SIGNATURE_INVALID when signature is forged for a known key', async () => {
    const trusted = generateKeypair();
    const wrong = generateKeypair();
    // Sign with WRONG key but advertise the trusted keyId — classic forgery attempt.
    const { signed, contentBytes } = buildSkillManifestAndContent(wrong.privateKey, 'k1');
    const { deps } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey: trusted.publicKey }],
      detectedTool: 'claude-code',
    });

    const result = await runInstall({ spec: 'voltagent/code-reviewer' }, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('MANIFEST_SIGNATURE_INVALID');
  });

  it('version pinning: install foo@1.2.0 fetches manifest at /agents/foo/1.2.0.json', async () => {
    const { privateKey, publicKey } = generateKeypair();
    const { signed, contentBytes } = buildSkillManifestAndContent(privateKey, 'k1', '1.2.0');
    const { deps, fetchSpy } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey }],
      detectedTool: 'claude-code',
      manifestVersionSlug: '1.2.0',
    });

    const result = await runInstall({ spec: 'voltagent/code-reviewer@1.2.0' }, deps);
    expect(result.ok).toBe(true);
    const calledWith = fetchSpy.mock.calls.map((c) => c[0] as string);
    expect(calledWith.some((url) => url.includes('1.2.0.json'))).toBe(true);
  });

  it('multi-tool install: --tool=claude-code,cursor → adapter.install called once per tool (best-effort)', async () => {
    // claude-skill is only compatible with claude-code, so cursor will report incompatible.
    // The summary should still include both tools as separate result rows (story E3.7 AC).
    const { privateKey, publicKey } = generateKeypair();
    const { signed, contentBytes } = buildSkillManifestAndContent(privateKey, 'k1');
    const { deps } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey }],
    });

    const result = await runInstall(
      { spec: 'voltagent/code-reviewer', tools: ['claude-code', 'cursor'] },
      deps,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tools = result.summary.results.map((r) => r.tool);
    expect(tools).toContain('claude-code');
    expect(tools).toContain('cursor');
    // claude-code succeeds; cursor reports incompatible (success=false).
    const claude = result.summary.results.find((r) => r.tool === 'claude-code');
    const cursor = result.summary.results.find((r) => r.tool === 'cursor');
    expect(claude?.success).toBe(true);
    expect(cursor?.success).toBe(false);
  });

  it('agent not found → returns MANIFEST_NOT_FOUND error', async () => {
    const { privateKey, publicKey } = generateKeypair();
    const { signed, contentBytes } = buildSkillManifestAndContent(privateKey, 'k1');
    const { deps, fetchSpy } = buildInstallDeps({
      manifest: signed,
      contentBytes,
      verificationKeys: [{ keyId: 'k1', publicKey }],
      detectedTool: 'claude-code',
    });
    // Reset fetch so manifest URL returns 404.
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await runInstall({ spec: 'no/such-agent' }, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('MANIFEST_NOT_FOUND');
  });
});
