// Tests for Stories E4.5 (Immutable AgentVersion + Content-Hash Storage) +
// E4.6 (Edit Metadata Without Version Bump).
//
// Real pglite + real LocalFsStorage against tmpdir. Asserts the DB+FS invariants
// that the implementer's POST /api/v1/publish handler must satisfy: dedup-on-hash,
// new agent_versions row, manifest at agents/<id>/<version>.json + latest.json.
//
// Route handler is it.todo until apps/web/app/api/v1/publish/route.ts ships.

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { PGlite } from '@electric-sql/pglite';
import { createLocalFsStorage, type ContentStorage } from '@datasetai/core';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

describe('publish API invariants (Stories E4.5 + E4.6)', () => {
  let pg: PGlite;
  let storage: ContentStorage;
  let storageRoot: string;

  beforeAll(async () => {
    pg = await bootstrapPglite();
    storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'datasetai-publish-'));
    storage = createLocalFsStorage({ rootDir: storageRoot });

    const userRes = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('alice@example.com', 'alice') RETURNING id",
    );
    const creatorId = userRes.rows[0]!.id;
    await pg.query(
      `INSERT INTO agents
        (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version, license, category, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        'alice/agent',
        'Alice Agent',
        'original description',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        creatorId,
        '1.0.0',
        'MIT',
        'productivity',
        ['orig-tag'],
      ],
    );
  }, 30_000);

  afterAll(async () => {
    await fs.rm(storageRoot, { recursive: true, force: true });
  });

  it('storing same content twice writes once on disk (dedup by sha256 hash)', async () => {
    const bytes = new Uint8Array(Buffer.from('tarball-bytes-v1', 'utf8'));
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');

    const r1 = await storage.putContent(hash, bytes);
    const r2 = await storage.putContent(hash, bytes);
    expect(r1.key).toBe(r2.key);
    expect(r1.url).toBe(r2.url);

    // Only one file on disk for this hash.
    const dir = path.join(storageRoot, 'content');
    const files = await fs.readdir(dir);
    expect(files.filter((f) => f.startsWith(hash))).toHaveLength(1);
  });

  it('publishing creates an agent_versions row with content_hash + immutable manifest URLs', async () => {
    const bytes = new Uint8Array(Buffer.from('tarball-bytes-v2', 'utf8'));
    const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    const put = await storage.putContent(hash, bytes);
    const manifestJson = JSON.stringify({
      schemaVersion: 1,
      id: 'alice/agent',
      version: '1.1.0',
      contentHash: hash,
      contentUrl: put.url,
    });
    const m = await storage.putManifest('alice/agent', '1.1.0', manifestJson);
    const latest = await storage.putLatestPointer('alice/agent', manifestJson);

    await pg.query(
      `INSERT INTO agent_versions (agent_id, version, content_hash, content_size_bytes, manifest_url, content_url, format)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['alice/agent', '1.1.0', hash, bytes.byteLength, m.url, put.url, 'claude-skill'],
    );

    const versions = await pg.query<{ version: string; content_hash: string }>(
      "SELECT version, content_hash FROM agent_versions WHERE agent_id = 'alice/agent' AND version = '1.1.0'",
    );
    expect(versions.rows).toHaveLength(1);
    expect(versions.rows[0]!.content_hash).toBe(hash);
    expect(m.key).toBe('agents/alice/agent/1.1.0.json');
    expect(latest.key).toBe('agents/alice/agent/latest.json');
  });

  it('E4.6 — editing metadata only updates the agents row; no new agent_versions row is created', async () => {
    const before = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM agent_versions WHERE agent_id = 'alice/agent'",
    );
    const beforeCount = before.rows[0]!.count;

    await pg.query(
      `UPDATE agents SET description = $1, tags = $2, category = $3, updated_at = NOW()
       WHERE id = $4`,
      ['updated description', ['new-tag-1', 'new-tag-2'], 'data', 'alice/agent'],
    );

    const after = await pg.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM agent_versions WHERE agent_id = 'alice/agent'",
    );
    expect(after.rows[0]!.count).toBe(beforeCount);

    const agent = await pg.query<{ description: string; tags: string[]; category: string }>(
      "SELECT description, tags, category FROM agents WHERE id = 'alice/agent'",
    );
    expect(agent.rows[0]!.description).toBe('updated description');
    expect(agent.rows[0]!.category).toBe('data');
    expect(agent.rows[0]!.tags).toContain('new-tag-1');
  });

  it.todo(
    'POST /api/v1/publish handler returns 201 with manifest URL — EXPECTS apps/web/app/api/v1/publish/route.ts',
  );
  it.todo(
    'PATCH /api/v1/agents/:id metadata edit returns 200 without bumping version — EXPECTS apps/web/app/api/v1/agents/[id]/route.ts',
  );
});
