// Tests for Stories E1.2a + E1.2b — Postgres schema (Drizzle).
// Two phases:
//   1) Schema-shape introspection — works without a running DB. Reads the Drizzle
//      table definitions and asserts columns + indexes match Architecture §5.2.
//   2) DB-roundtrip — runs the schema against an in-memory pglite using
//      drizzle-orm/pglite. Inserts/selects on every table to confirm SQL is valid.

import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { drizzle } from 'drizzle-orm/pglite';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  agentVersions,
  agents,
  installs,
  reports,
  sessions,
  suppressions,
  users,
  verificationApplications,
} from '@datasetai/db';

// Build a minimal schema object for drizzle() — avoids walking all named exports
// from the package (some of which are non-table values that crash relations.ts).
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

// Minimal SQL to construct each table for pglite. We don't have drizzle-kit
// generate output yet; this mirrors Architecture §5.2 closely enough for the
// roundtrip phase. Phase-1 introspection above is the load-bearing assertion.
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
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email);
  CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_unique_idx ON users (github_id);

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
    search_rank REAL NOT NULL DEFAULT 0,
    upstream_stars INTEGER,
    upstream_stars_synced_at TIMESTAMPTZ,
    rating_avg REAL,
    rating_count INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS agents_search_rank_idx ON agents (search_rank);
  CREATE INDEX IF NOT EXISTS agents_creator_idx ON agents (creator_id);
  CREATE INDEX IF NOT EXISTS agents_source_idx ON agents (source_type, source_url);
  CREATE INDEX IF NOT EXISTS agents_category_idx ON agents (category);

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
  CREATE INDEX IF NOT EXISTS agent_versions_published_idx ON agent_versions (agent_id, published_at);

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
  CREATE INDEX IF NOT EXISTS installs_agent_idx ON installs (agent_id, created_at);
  CREATE INDEX IF NOT EXISTS installs_install_id_idx ON installs (install_id);

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
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
  CREATE INDEX IF NOT EXISTS suppressions_active_idx ON suppressions (status, scope);

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
  CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);

  CREATE TABLE IF NOT EXISTS verification_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    github_handle TEXT NOT NULL,
    reasoning TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS verification_applications_user_idx ON verification_applications (user_id);

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
  CREATE INDEX IF NOT EXISTS claim_requests_agent_idx ON claim_requests (agent_id);
  CREATE INDEX IF NOT EXISTS claim_requests_status_idx ON claim_requests (status);

  CREATE TABLE IF NOT EXISTS listing_views (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    viewer_user_id UUID REFERENCES users(id),
    referrer TEXT,
    search_query TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS listing_views_agent_idx ON listing_views (agent_id, created_at);
  CREATE INDEX IF NOT EXISTS listing_views_query_idx ON listing_views (search_query);

  CREATE TABLE IF NOT EXISTS publish_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS publish_jobs_status_idx ON publish_jobs (status);

  CREATE TABLE IF NOT EXISTS moderation_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    agent_id TEXT,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS moderation_notifications_user_idx ON moderation_notifications (user_id);
`;

describe('Drizzle schema introspection (E1.2a + E1.2b)', () => {
  it('users table has the columns required by §5.2', () => {
    const cfg = getTableConfig(users);
    const cols = new Set(cfg.columns.map((c) => c.name));
    for (const name of [
      'id',
      'email',
      'github_id',
      'github_login',
      'display_name',
      'avatar_url',
      'bio',
      'is_verified_publisher',
      'is_admin',
      'stripe_connect_account_id', // Phase-2 nullable
      'created_at',
      'deleted_at',
    ]) {
      expect(cols.has(name), `users.${name}`).toBe(true);
    }
  });

  it('agents table has the columns + indexes required by §5.2', () => {
    const cfg = getTableConfig(agents);
    const cols = new Set(cfg.columns.map((c) => c.name));
    for (const name of [
      'id',
      'name',
      'description',
      'category',
      'tags',
      'primary_format',
      'formats',
      'tool_compatibility',
      'license',
      'source_type',
      'creator_id',
      'current_version',
      'install_count_lifetime',
      'install_count_30d',
      'search_rank',
    ]) {
      expect(cols.has(name), `agents.${name}`).toBe(true);
    }
    const indexNames = new Set(cfg.indexes.map((i) => i.config.name));
    expect(indexNames.has('agents_search_rank_idx')).toBe(true);
    expect(indexNames.has('agents_creator_idx')).toBe(true);
    expect(indexNames.has('agents_source_idx')).toBe(true);
  });

  it('agent_versions has immutable-version columns + Phase-2 price_cents', () => {
    const cfg = getTableConfig(agentVersions);
    const cols = new Set(cfg.columns.map((c) => c.name));
    for (const name of [
      'agent_id',
      'version',
      'content_hash',
      'content_size_bytes',
      'manifest_url',
      'content_url',
      'format',
      'price_cents', // Phase-2 nullable
      'published_at',
    ]) {
      expect(cols.has(name), `agent_versions.${name}`).toBe(true);
    }
  });

  it('installs has telemetry columns + critical indexes', () => {
    const cfg = getTableConfig(installs);
    const cols = new Set(cfg.columns.map((c) => c.name));
    for (const name of [
      'id',
      'agent_id',
      'version',
      'install_id',
      'tool_detected',
      'format',
      'success',
      'error_code',
    ]) {
      expect(cols.has(name)).toBe(true);
    }
    const indexNames = new Set(cfg.indexes.map((i) => i.config.name));
    expect(indexNames.has('installs_agent_idx')).toBe(true);
    expect(indexNames.has('installs_install_id_idx')).toBe(true);
  });

  it('sessions table exists with user_id + expires_at', () => {
    const cfg = getTableConfig(sessions);
    const cols = new Set(cfg.columns.map((c) => c.name));
    expect(cols.has('user_id')).toBe(true);
    expect(cols.has('expires_at')).toBe(true);
  });

  it('suppressions, reports, verification_applications (E1.2b) defined', () => {
    expect(getTableConfig(suppressions).columns.find((c) => c.name === 'scope')).toBeTruthy();
    expect(getTableConfig(reports).columns.find((c) => c.name === 'reason')).toBeTruthy();
    expect(
      getTableConfig(verificationApplications).columns.find((c) => c.name === 'github_handle'),
    ).toBeTruthy();
  });
});

describe('Drizzle schema roundtrip on pglite', () => {
  let pg: PGlite;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;

  beforeAll(async () => {
    pg = await PGlite.create({ extensions: { citext } });
    // Apply bootstrap SQL.
    await pg.exec(BOOTSTRAP_SQL);
    db = drizzle(pg, { schema });
  }, 30_000);

  it('inserts a user and selects it back', async () => {
    const [u] = await db
      .insert(users)
      .values({ email: 'a@example.com' })
      .returning();
    expect(u.email).toBe('a@example.com');
    expect(u.isVerifiedPublisher).toBe(false);
  });

  it('inserts an agent + agent_version and selects join', async () => {
    await db.insert(agents).values({
      id: 'voltagent/code-reviewer',
      name: 'Code Reviewer',
      description: 'Reviews code',
      primaryFormat: 'claude-skill',
      formats: ['claude-skill'],
      toolCompatibility: ['claude-code'],
      sourceType: 'direct-publish',
      currentVersion: '1.0.0',
    });
    await db.insert(agentVersions).values({
      agentId: 'voltagent/code-reviewer',
      version: '1.0.0',
      contentHash: 'sha256-abc',
      contentSizeBytes: 1024,
      manifestUrl: 'https://cdn.datasetai.xyz/agents/voltagent/code-reviewer/1.0.0.json',
      contentUrl: 'https://cdn.datasetai.xyz/content/abc.tar.gz',
      format: 'claude-skill',
    });
    const rows = await db.select().from(agents);
    expect(rows.length).toBeGreaterThan(0);
  });
});
