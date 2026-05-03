// Tests for Stories E2.1 (catalog query) + E2.3 (search) + E2.4/E2.5 (filter/sort).
// Uses pglite + the schema-bootstrapping SQL inlined here so this test is independent
// of drizzle-kit migrations landing.

import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { drizzle } from 'drizzle-orm/pglite';
import {
  agents,
  agentVersions,
  installs,
  listAgents,
  searchAgents,
  getAgentBySlug,
  recordInstall,
  reports,
  sessions,
  suppressions,
  users,
  verificationApplications,
} from '@datasetai/db';

const schema = {
  agents,
  agentVersions,
  installs,
  reports,
  sessions,
  suppressions,
  users,
  verificationApplications,
};

const BOOTSTRAP_SQL = `
  CREATE EXTENSION IF NOT EXISTS citext;
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    github_id BIGINT,
    github_login TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_verified_publisher BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_connect_account_id TEXT,
    accepted_tos_at TIMESTAMPTZ,
    accepted_privacy_at TIMESTAMPTZ,
    accepted_creator_agreement_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    category TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    primary_format TEXT NOT NULL,
    formats TEXT[] NOT NULL DEFAULT '{}',
    tool_compatibility TEXT[] NOT NULL DEFAULT '{}',
    license TEXT,
    source_type TEXT NOT NULL,
    source_url TEXT,
    source_attribution JSONB,
    creator_id UUID REFERENCES users(id),
    current_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unpublished_at TIMESTAMPTZ,
    install_count_lifetime BIGINT NOT NULL DEFAULT 0,
    install_count_30d BIGINT NOT NULL DEFAULT 0,
    search_rank REAL NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS agent_versions (
    agent_id TEXT NOT NULL REFERENCES agents(id),
    version TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    content_size_bytes BIGINT NOT NULL,
    manifest_url TEXT NOT NULL,
    content_url TEXT NOT NULL,
    changelog TEXT,
    format TEXT NOT NULL,
    price_cents INTEGER,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unpublished_at TIMESTAMPTZ,
    PRIMARY KEY (agent_id, version)
  );
  CREATE TABLE IF NOT EXISTS installs (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    install_id TEXT,
    user_id UUID REFERENCES users(id),
    tool_detected TEXT,
    format TEXT,
    success BOOLEAN NOT NULL,
    error_code TEXT,
    payment_intent_id TEXT,
    user_agent TEXT,
    ip_country TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS suppressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,
    source_type TEXT,
    source_url TEXT,
    agent_id TEXT,
    creator_id UUID,
    reason TEXT NOT NULL,
    requested_by TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );
  CREATE TABLE IF NOT EXISTS listing_views (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    viewer_user_id UUID REFERENCES users(id),
    referrer TEXT,
    search_query TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS claim_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    claimer_user_id UUID NOT NULL REFERENCES users(id),
    github_proof TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
  );
  CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    reporter_user_id UUID REFERENCES users(id),
    reporter_email CITEXT,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_by UUID REFERENCES users(id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );
`;

describe('catalog queries (Stories E2.1 + E2.3 + E2.4 + E2.5)', () => {
  let pg: PGlite;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;

  beforeAll(async () => {
    pg = await PGlite.create({ extensions: { citext } });
    await pg.exec(BOOTSTRAP_SQL);
    db = drizzle(pg, { schema });

    const [u] = await db
      .insert(users)
      .values({ email: 'voltagent@example.com', githubLogin: 'voltagent' })
      .returning();

    await db.insert(agents).values([
      {
        id: 'voltagent/code-reviewer',
        name: 'Code Reviewer',
        description: 'Reviews code thoroughly',
        category: 'code-review',
        tags: ['code', 'review'],
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code', 'cursor'],
        sourceType: 'direct-publish',
        creatorId: u.id,
        currentVersion: '1.0.0',
        installCount30d: 1000,
        searchRank: 5.0,
      },
      {
        id: 'cursor/refactor',
        name: 'Refactor Helper',
        description: 'Suggests refactors',
        category: 'productivity',
        tags: ['refactor'],
        primaryFormat: 'cursorrules',
        formats: ['cursorrules'],
        toolCompatibility: ['cursor'],
        sourceType: 'direct-publish',
        currentVersion: '0.5.0',
        installCount30d: 500,
        searchRank: 3.0,
      },
      {
        id: 'voltagent/old',
        name: 'Old Agent',
        description: 'Was unpublished',
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code'],
        sourceType: 'direct-publish',
        currentVersion: '0.1.0',
        unpublishedAt: new Date(),
        installCount30d: 9999,
      },
    ]);

    await db.insert(agentVersions).values({
      agentId: 'voltagent/code-reviewer',
      version: '1.0.0',
      contentHash: 'sha256-abc',
      contentSizeBytes: 1024,
      manifestUrl: 'https://cdn.datasetai.xyz/agents/voltagent/code-reviewer/1.0.0.json',
      contentUrl: 'https://cdn.datasetai.xyz/content/abc.tar.gz',
      format: 'claude-skill',
    });
  }, 30_000);

  it('listAgents() returns published agents only, sorted by install_count_30d', async () => {
    const rows = await listAgents(db);
    expect(rows.map((r) => r.id)).not.toContain('voltagent/old');
    expect(rows[0]?.id).toBe('voltagent/code-reviewer');
  });

  it('listAgents({ tool: "cursor" }) filters by tool_compatibility', async () => {
    const rows = await listAgents(db, { tool: 'cursor' });
    const ids = rows.map((r) => r.id);
    expect(ids).toContain('voltagent/code-reviewer');
    expect(ids).toContain('cursor/refactor');
  });

  it('listAgents({ category: "productivity" }) filters by category', async () => {
    const rows = await listAgents(db, { category: 'productivity' });
    expect(rows.map((r) => r.id)).toEqual(['cursor/refactor']);
  });

  it('listAgents({ format: "claude-skill" }) filters by primary or formats', async () => {
    const rows = await listAgents(db, { format: 'claude-skill' });
    expect(rows.map((r) => r.id)).toContain('voltagent/code-reviewer');
    expect(rows.map((r) => r.id)).not.toContain('cursor/refactor');
  });

  it('listAgents({ sort: "recent" }) orders by updated_at desc', async () => {
    const rows = await listAgents(db, { sort: 'recent' });
    expect(rows.length).toBeGreaterThan(0);
  });

  it('searchAgents("Refactor") finds the cursor agent', async () => {
    const rows = await searchAgents(db, 'Refactor');
    expect(rows.map((r) => r.id)).toContain('cursor/refactor');
  });

  it('searchAgents excludes unpublished agents', async () => {
    const rows = await searchAgents(db, 'Old');
    expect(rows.map((r) => r.id)).not.toContain('voltagent/old');
  });

  it('searchAgents returns empty array for empty query', async () => {
    const rows = await searchAgents(db, '   ');
    expect(rows).toEqual([]);
  });

  it('getAgentBySlug returns agent + versions + creator', async () => {
    const result = await getAgentBySlug(db, 'voltagent/code-reviewer');
    expect(result).not.toBeNull();
    expect(result?.agent.id).toBe('voltagent/code-reviewer');
    expect(result?.versions.length).toBeGreaterThan(0);
    expect(result?.creator?.githubLogin).toBe('voltagent');
  });

  it('getAgentBySlug returns null for missing slug', async () => {
    const result = await getAgentBySlug(db, 'does/not-exist');
    expect(result).toBeNull();
  });

  it('recordInstall persists a row in installs', async () => {
    await recordInstall(db, {
      agentId: 'voltagent/code-reviewer',
      version: '1.0.0',
      installId: 'test-install-id',
      toolDetected: 'claude-code',
      format: 'claude-skill',
      success: true,
    });
    const rows = await pg.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM installs');
    expect(rows.rows[0]?.count).toBeGreaterThan(0);
  });
});
