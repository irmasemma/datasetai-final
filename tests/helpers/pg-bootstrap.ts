// Shared pglite bootstrap SQL — keeps tests independent of drizzle-kit migrations.
// Mirrors packages/db/src/schema.ts including round-2 (E4-E7) tables.
//
// IMPORTANT: This is a TEST helper. The implementer's BOOTSTRAP_SQL in
// packages/db/__tests__/schema.test.ts diverges from current schema (missing
// accepted_tos_at columns) — that's a pre-existing implementer bug; we don't
// touch it. Our tests use this helper.

import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';

export const TEST_BOOTSTRAP_SQL = `
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
    search_rank REAL NOT NULL DEFAULT 0
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

export async function bootstrapPglite(): Promise<PGlite> {
  const pg = await PGlite.create({ extensions: { citext } });
  await pg.exec(TEST_BOOTSTRAP_SQL);
  return pg;
}
