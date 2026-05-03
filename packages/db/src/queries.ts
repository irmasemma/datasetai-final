// Query helpers for the catalog/listing/search hot paths. Pure functions over a Database.
// MVP search uses Postgres ILIKE + tsvector as a placeholder for Meilisearch (Architecture AD-7).
// The Meilisearch swap-in lands in E2.3 follow-up; this is the MVP fallback.

import { and, desc, eq, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import type { Database } from './client.js';
import {
  agentVersions,
  agents,
  claimRequests,
  installs,
  listingViews,
  reports,
  suppressions,
  users,
  type Agent,
  type AgentVersion,
  type User,
} from './schema.js';

export type SortKey = 'recent' | 'most-installed' | 'relevance';

export interface CatalogFilters {
  readonly format?: string;
  readonly category?: string;
  readonly tag?: string;
  readonly tool?: string;
  readonly creatorId?: string;
  readonly creatorLogin?: string;
  readonly query?: string;
  readonly sort?: SortKey;
  readonly limit?: number;
  readonly offset?: number;
}

export interface AgentCard {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly primaryFormat: string;
  readonly formats: readonly string[];
  readonly toolCompatibility: readonly string[];
  readonly category: string | null;
  readonly tags: readonly string[];
  readonly license: string | null;
  readonly creatorLogin: string | null;
  readonly sourceType: string;
  readonly installCount30d: number;
  readonly installCountLifetime: number;
  readonly updatedAt: Date;
}

function rowToCard(row: Agent & { creatorLogin: string | null }): AgentCard {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    primaryFormat: row.primaryFormat,
    formats: row.formats,
    toolCompatibility: row.toolCompatibility,
    category: row.category,
    tags: row.tags,
    license: row.license,
    creatorLogin: row.creatorLogin,
    sourceType: row.sourceType,
    installCount30d: row.installCount30d,
    installCountLifetime: row.installCountLifetime,
    updatedAt: row.updatedAt,
  };
}

async function suppressedAgentIds(db: Database): Promise<readonly string[]> {
  const rows = await db
    .select({ agentId: suppressions.agentId })
    .from(suppressions)
    .where(and(eq(suppressions.status, 'active'), sql`${suppressions.agentId} IS NOT NULL`));
  return rows.map((r) => r.agentId).filter((id): id is string => typeof id === 'string');
}

export async function listAgents(db: Database, filters: CatalogFilters = {}): Promise<AgentCard[]> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  const conditions = [isNull(agents.unpublishedAt)];

  const suppressed = await suppressedAgentIds(db);
  if (suppressed.length > 0) {
    conditions.push(sql`${agents.id} NOT IN (${sql.join(suppressed.map((s) => sql`${s}`), sql`, `)})`);
  }

  if (filters.format) {
    conditions.push(
      or(
        eq(agents.primaryFormat, filters.format),
        sql`${filters.format} = ANY(${agents.formats})`,
      )!,
    );
  }
  if (filters.category) {
    conditions.push(eq(agents.category, filters.category));
  }
  if (filters.tool) {
    conditions.push(sql`${filters.tool} = ANY(${agents.toolCompatibility})`);
  }
  if (filters.tag) {
    conditions.push(sql`${filters.tag} = ANY(${agents.tags})`);
  }
  if (filters.creatorId) {
    conditions.push(eq(agents.creatorId, filters.creatorId));
  }
  if (filters.query) {
    const like = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(agents.name, like),
        ilike(agents.description, like),
        ilike(agents.id, like),
      )!,
    );
  }

  const sort = filters.sort ?? (filters.query ? 'relevance' : 'most-installed');
  const orderClause =
    sort === 'recent'
      ? desc(agents.updatedAt)
      : sort === 'relevance'
        ? desc(agents.searchRank)
        : desc(agents.installCount30d);

  const rows = await db
    .select({
      id: agents.id,
      name: agents.name,
      description: agents.description,
      longDescription: agents.longDescription,
      category: agents.category,
      tags: agents.tags,
      primaryFormat: agents.primaryFormat,
      formats: agents.formats,
      toolCompatibility: agents.toolCompatibility,
      license: agents.license,
      sourceType: agents.sourceType,
      sourceUrl: agents.sourceUrl,
      sourceAttribution: agents.sourceAttribution,
      creatorId: agents.creatorId,
      currentVersion: agents.currentVersion,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
      unpublishedAt: agents.unpublishedAt,
      installCountLifetime: agents.installCountLifetime,
      installCount30d: agents.installCount30d,
      searchRank: agents.searchRank,
      creatorLogin: users.githubLogin,
    })
    .from(agents)
    .leftJoin(users, eq(users.id, agents.creatorId))
    .where(and(...conditions))
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);

  return rows.map(rowToCard);
}

export async function getAgentBySlug(
  db: Database,
  slug: string,
): Promise<{ agent: Agent; creator: User | null; versions: AgentVersion[] } | null> {
  const [agent] = await db.select().from(agents).where(eq(agents.id, slug)).limit(1);
  if (!agent) return null;

  const creator = agent.creatorId
    ? (await db.select().from(users).where(eq(users.id, agent.creatorId)).limit(1))[0] ?? null
    : null;

  const versions = await db
    .select()
    .from(agentVersions)
    .where(eq(agentVersions.agentId, slug))
    .orderBy(desc(agentVersions.publishedAt))
    .limit(20);

  return { agent, creator: creator ?? null, versions };
}

export async function getAgentByCreator(
  db: Database,
  creatorLogin: string,
): Promise<{ creator: User; agents: AgentCard[] } | null> {
  const [creator] = await db
    .select()
    .from(users)
    .where(eq(users.githubLogin, creatorLogin))
    .limit(1);
  if (!creator) return null;

  const list = await listAgents(db, { creatorId: creator.id, sort: 'recent', limit: 100 });
  return { creator, agents: list };
}

export async function listCategories(
  db: Database,
): Promise<Array<{ category: string; count: number }>> {
  const rows = await db
    .select({
      category: agents.category,
      count: sql<number>`count(*)::int`,
    })
    .from(agents)
    .where(and(isNull(agents.unpublishedAt), sql`${agents.category} IS NOT NULL`))
    .groupBy(agents.category);

  return rows
    .filter((r): r is { category: string; count: number } => r.category != null)
    .sort((a, b) => b.count - a.count);
}

export interface SearchResult extends AgentCard {
  readonly score: number;
}

export async function searchAgents(
  db: Database,
  query: string,
  filters: Omit<CatalogFilters, 'query' | 'sort'> = {},
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const cards = await listAgents(db, { ...filters, query, sort: 'relevance' });
  const q = query.toLowerCase();
  return cards.map((c) => {
    let score = c.installCount30d / 1000;
    if (c.id.toLowerCase().includes(q)) score += 5;
    if (c.name.toLowerCase().includes(q)) score += 3;
    if (c.description.toLowerCase().includes(q)) score += 1;
    return { ...c, score };
  });
}

export async function recordInstall(
  db: Database,
  event: {
    agentId: string;
    version: string;
    installId?: string;
    toolDetected?: string;
    format?: string;
    success: boolean;
    errorCode?: string;
    userAgent?: string;
    ipCountry?: string;
  },
): Promise<void> {
  await db.insert(installs).values({
    agentId: event.agentId,
    version: event.version,
    installId: event.installId ?? null,
    toolDetected: event.toolDetected ?? null,
    format: event.format ?? null,
    success: event.success,
    errorCode: event.errorCode ?? null,
    userAgent: event.userAgent ?? null,
    ipCountry: event.ipCountry ?? null,
  });
}

export interface InstallMetrics {
  readonly lifetime: number;
  readonly last7d: number;
  readonly last30d: number;
  readonly byTool: Readonly<Record<string, number>>;
  readonly byVersion: Readonly<Record<string, number>>;
}

export async function installMetrics(db: Database, agentId: string): Promise<InstallMetrics> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [lifetimeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(installs)
    .where(and(eq(installs.agentId, agentId), eq(installs.success, true)));

  const [d7Row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(installs)
    .where(
      and(
        eq(installs.agentId, agentId),
        eq(installs.success, true),
        gte(installs.createdAt, d7),
      ),
    );

  const [d30Row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(installs)
    .where(
      and(
        eq(installs.agentId, agentId),
        eq(installs.success, true),
        gte(installs.createdAt, d30),
      ),
    );

  const toolRows = await db
    .select({
      tool: installs.toolDetected,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(and(eq(installs.agentId, agentId), eq(installs.success, true)))
    .groupBy(installs.toolDetected);

  const byTool: Record<string, number> = {};
  for (const row of toolRows) byTool[row.tool ?? 'unknown'] = row.count;

  const versionRows = await db
    .select({
      version: installs.version,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(and(eq(installs.agentId, agentId), eq(installs.success, true)))
    .groupBy(installs.version);

  const byVersion: Record<string, number> = {};
  for (const row of versionRows) byVersion[row.version] = row.count;

  return {
    lifetime: lifetimeRow?.count ?? 0,
    last7d: d7Row?.count ?? 0,
    last30d: d30Row?.count ?? 0,
    byTool,
    byVersion,
  };
}

export interface DailyInstallRollup {
  readonly date: string;
  readonly version: string;
  readonly tool: string;
  readonly count: number;
}

export async function installRollupDaily(
  db: Database,
  agentId: string,
  daysBack: number,
): Promise<DailyInstallRollup[]> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      date: sql<string>`to_char(${installs.createdAt}::date, 'YYYY-MM-DD')`,
      version: installs.version,
      tool: installs.toolDetected,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(
      and(
        eq(installs.agentId, agentId),
        eq(installs.success, true),
        gte(installs.createdAt, since),
      ),
    )
    .groupBy(sql`${installs.createdAt}::date`, installs.version, installs.toolDetected)
    .orderBy(sql`${installs.createdAt}::date`);

  return rows.map((r) => ({
    date: r.date,
    version: r.version,
    tool: r.tool ?? 'unknown',
    count: r.count,
  }));
}

export async function recordListingView(
  db: Database,
  view: { agentId: string; viewerUserId?: string | null; referrer?: string | null; searchQuery?: string | null },
): Promise<void> {
  await db.insert(listingViews).values({
    agentId: view.agentId,
    viewerUserId: view.viewerUserId ?? null,
    referrer: view.referrer ?? null,
    searchQuery: view.searchQuery ?? null,
  });
}

export async function listingViewStats(
  db: Database,
  agentId: string,
): Promise<{ total: number; topQueries: Array<{ query: string; count: number }> }> {
  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listingViews)
    .where(eq(listingViews.agentId, agentId));
  const count = totalRows[0]?.count ?? 0;

  const queryRows = await db
    .select({
      query: listingViews.searchQuery,
      count: sql<number>`count(*)::int`,
    })
    .from(listingViews)
    .where(and(eq(listingViews.agentId, agentId), sql`${listingViews.searchQuery} IS NOT NULL`))
    .groupBy(listingViews.searchQuery)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(10);

  return {
    total: count ?? 0,
    topQueries: queryRows
      .map((r) => ({ query: r.query ?? '', count: r.count }))
      .filter((r) => r.query.length > 0),
  };
}

export async function listAgentsByCreatorId(
  db: Database,
  creatorId: string,
): Promise<Agent[]> {
  return db
    .select()
    .from(agents)
    .where(eq(agents.creatorId, creatorId))
    .orderBy(desc(agents.updatedAt));
}

export async function findUserByGithubId(
  db: Database,
  githubId: number,
): Promise<User | null> {
  const [u] = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
  return u ?? null;
}

export async function findUserById(db: Database, id: string): Promise<User | null> {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}

export interface PendingReportCard {
  readonly id: string;
  readonly agentId: string;
  readonly reason: string;
  readonly details: string | null;
  readonly status: string;
  readonly createdAt: Date;
}

export async function listPendingReports(db: Database): Promise<PendingReportCard[]> {
  const rows = await db
    .select({
      id: reports.id,
      agentId: reports.agentId,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.status, 'pending'))
    .orderBy(desc(reports.createdAt));
  return rows;
}

export async function listClaimRequests(db: Database, status = 'pending') {
  return db
    .select()
    .from(claimRequests)
    .where(eq(claimRequests.status, status))
    .orderBy(desc(claimRequests.createdAt));
}

export async function listSuppressions(db: Database) {
  return db.select().from(suppressions).orderBy(desc(suppressions.createdAt));
}

export async function isAgentSuppressed(db: Database, agentId: string): Promise<boolean> {
  const rows = await db
    .select({ id: suppressions.id })
    .from(suppressions)
    .where(
      and(
        eq(suppressions.status, 'active'),
        or(eq(suppressions.agentId, agentId), eq(suppressions.scope, 'agent'))!,
      ),
    )
    .limit(1);
  if (rows.length === 0) return false;
  const matchOnId = await db
    .select({ id: suppressions.id })
    .from(suppressions)
    .where(and(eq(suppressions.status, 'active'), eq(suppressions.agentId, agentId)))
    .limit(1);
  return matchOnId.length > 0;
}

export async function getInstallCountsForAgents(
  db: Database,
  agentIds: readonly string[],
): Promise<Record<string, { lifetime: number; last7d: number; last30d: number }>> {
  if (agentIds.length === 0) return {};
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const lifetimeRows = await db
    .select({
      agentId: installs.agentId,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(and(eq(installs.success, true), inArray(installs.agentId, agentIds as string[])))
    .groupBy(installs.agentId);

  const d7Rows = await db
    .select({
      agentId: installs.agentId,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(
      and(
        eq(installs.success, true),
        gte(installs.createdAt, d7),
        inArray(installs.agentId, agentIds as string[]),
      ),
    )
    .groupBy(installs.agentId);

  const d30Rows = await db
    .select({
      agentId: installs.agentId,
      count: sql<number>`count(*)::int`,
    })
    .from(installs)
    .where(
      and(
        eq(installs.success, true),
        gte(installs.createdAt, d30),
        inArray(installs.agentId, agentIds as string[]),
      ),
    )
    .groupBy(installs.agentId);

  const out: Record<string, { lifetime: number; last7d: number; last30d: number }> = {};
  for (const id of agentIds) out[id] = { lifetime: 0, last7d: 0, last30d: 0 };
  for (const r of lifetimeRows) out[r.agentId] = { ...out[r.agentId]!, lifetime: r.count };
  for (const r of d7Rows) out[r.agentId] = { ...out[r.agentId]!, last7d: r.count };
  for (const r of d30Rows) out[r.agentId] = { ...out[r.agentId]!, last30d: r.count };
  return out;
}
