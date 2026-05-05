// Drizzle schema for datasetai.xyz.
// Architecture §5.2 — every table here is the system of record (Postgres).
// Stories E1.2a (core: users, agents, agent_versions, installs, sessions)
// and E1.2b (trust: suppressions, reports, verification_applications).
// Phase-2 nullable columns per AD-10 (Stripe Connect / paid agents) are present.

import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'citext';
  },
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull(),
    githubId: bigint('github_id', { mode: 'number' }),
    githubLogin: text('github_login'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    isVerifiedPublisher: boolean('is_verified_publisher').notNull().default(false),
    isAdmin: boolean('is_admin').notNull().default(false),
    stripeConnectAccountId: text('stripe_connect_account_id'),
    acceptedTosAt: timestamp('accepted_tos_at', { withTimezone: true }),
    acceptedPrivacyAt: timestamp('accepted_privacy_at', { withTimezone: true }),
    acceptedCreatorAgreementAt: timestamp('accepted_creator_agreement_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique_idx').on(t.email),
    githubIdUnique: uniqueIndex('users_github_id_unique_idx').on(t.githubId),
  }),
);

export const agents = pgTable(
  'agents',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    longDescription: text('long_description'),
    category: text('category'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    primaryFormat: text('primary_format').notNull(),
    formats: text('formats').array().notNull().default(sql`'{}'::text[]`),
    toolCompatibility: text('tool_compatibility').array().notNull().default(sql`'{}'::text[]`),
    license: text('license'),
    sourceType: text('source_type').notNull(),
    sourceUrl: text('source_url'),
    sourceAttribution: jsonb('source_attribution'),
    creatorId: uuid('creator_id').references(() => users.id),
    currentVersion: text('current_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    unpublishedAt: timestamp('unpublished_at', { withTimezone: true }),
    installCountLifetime: bigint('install_count_lifetime', { mode: 'number' }).notNull().default(0),
    installCount30d: bigint('install_count_30d', { mode: 'number' }).notNull().default(0),
    searchRank: real('search_rank').notNull().default(0),
    // Two-rating model: upstream is "social proof from the source repo" (cached
    // GitHub stars), rating is our own from logged-in users (only shown when
    // ratingCount >= 5 to avoid single-vote skew).
    upstreamStars: integer('upstream_stars'),
    upstreamStarsSyncedAt: timestamp('upstream_stars_synced_at', { withTimezone: true }),
    ratingAvg: real('rating_avg'),
    ratingCount: integer('rating_count').notNull().default(0),
  },
  (t) => ({
    searchRankIdx: index('agents_search_rank_idx').on(t.searchRank),
    creatorIdx: index('agents_creator_idx').on(t.creatorId),
    sourceIdx: index('agents_source_idx').on(t.sourceType, t.sourceUrl),
    categoryIdx: index('agents_category_idx').on(t.category),
  }),
);

export const agentVersions = pgTable(
  'agent_versions',
  {
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id),
    version: text('version').notNull(),
    contentHash: text('content_hash').notNull(),
    contentSizeBytes: bigint('content_size_bytes', { mode: 'number' }).notNull(),
    manifestUrl: text('manifest_url').notNull(),
    contentUrl: text('content_url').notNull(),
    changelog: text('changelog'),
    format: text('format').notNull(),
    priceCents: integer('price_cents'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    unpublishedAt: timestamp('unpublished_at', { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.agentId, t.version] }),
    publishedIdx: index('agent_versions_published_idx').on(t.agentId, t.publishedAt),
  }),
);

export const installs = pgTable(
  'installs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    agentId: text('agent_id').notNull(),
    version: text('version').notNull(),
    installId: text('install_id'),
    userId: uuid('user_id').references(() => users.id),
    toolDetected: text('tool_detected'),
    format: text('format'),
    success: boolean('success').notNull(),
    errorCode: text('error_code'),
    paymentIntentId: text('payment_intent_id'),
    userAgent: text('user_agent'),
    ipCountry: text('ip_country'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentIdx: index('installs_agent_idx').on(t.agentId, t.createdAt),
    installIdIdx: index('installs_install_id_idx').on(t.installId),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.userId),
    expiresIdx: index('sessions_expires_idx').on(t.expiresAt),
  }),
);

// E1.2b — trust & moderation tables (suppressions, reports, verification_applications).

export const suppressions = pgTable(
  'suppressions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    sourceType: text('source_type'),
    sourceUrl: text('source_url'),
    agentId: text('agent_id'),
    creatorId: uuid('creator_id'),
    reason: text('reason').notNull(),
    requestedBy: text('requested_by'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => ({
    activeIdx: index('suppressions_active_idx').on(t.status, t.scope),
  }),
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: text('agent_id').notNull(),
    reporterUserId: uuid('reporter_user_id').references(() => users.id),
    reporterEmail: citext('reporter_email'),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('pending'),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('reports_status_idx').on(t.status),
  }),
);

export const verificationApplications = pgTable(
  'verification_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    githubHandle: text('github_handle').notNull(),
    reasoning: text('reasoning'),
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewerNote: text('reviewer_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('verification_applications_user_idx').on(t.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type AgentVersion = typeof agentVersions.$inferSelect;
export type NewAgentVersion = typeof agentVersions.$inferInsert;

export type Install = typeof installs.$inferSelect;
export type NewInstall = typeof installs.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Suppression = typeof suppressions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type VerificationApplication = typeof verificationApplications.$inferSelect;

// Round-2 (E4-E7) additions.

export const claimRequests = pgTable(
  'claim_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: text('agent_id').notNull(),
    claimerUserId: uuid('claimer_user_id').notNull().references(() => users.id),
    githubProof: text('github_proof'),
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewerNote: text('reviewer_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => ({
    agentIdx: index('claim_requests_agent_idx').on(t.agentId),
    statusIdx: index('claim_requests_status_idx').on(t.status),
  }),
);

export const listingViews = pgTable(
  'listing_views',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    agentId: text('agent_id').notNull(),
    viewerUserId: uuid('viewer_user_id').references(() => users.id),
    referrer: text('referrer'),
    searchQuery: text('search_query'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentIdx: index('listing_views_agent_idx').on(t.agentId, t.createdAt),
    queryIdx: index('listing_views_query_idx').on(t.searchQuery),
  }),
);

export const publishJobs = pgTable(
  'publish_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: text('agent_id').notNull(),
    version: text('version').notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('publish_jobs_status_idx').on(t.status),
  }),
);

export const moderationNotifications = pgTable(
  'moderation_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    agentId: text('agent_id'),
    kind: text('kind').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('moderation_notifications_user_idx').on(t.userId),
  }),
);

export type ClaimRequest = typeof claimRequests.$inferSelect;
export type NewClaimRequest = typeof claimRequests.$inferInsert;
export type ListingView = typeof listingViews.$inferSelect;
export type NewListingView = typeof listingViews.$inferInsert;
export type PublishJob = typeof publishJobs.$inferSelect;
export type NewPublishJob = typeof publishJobs.$inferInsert;
export type ModerationNotification = typeof moderationNotifications.$inferSelect;
export type NewModerationNotification = typeof moderationNotifications.$inferInsert;
