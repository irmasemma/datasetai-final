// Catalog data layer for the web app. Tries the real DB first, falls back to fixtures.
// All page-level Server Components import from this file — they never touch Drizzle directly.

import { sql } from 'drizzle-orm';
import {
  listAgents as dbListAgents,
  getAgentBySlug as dbGetAgentBySlug,
  searchAgents as dbSearchAgents,
  getAgentByCreator as dbGetAgentByCreator,
  listCategories as dbListCategories,
  agents,
  type AgentCard,
  type CatalogFilters,
  type SearchResult,
} from '@datasetai/db';
import { getDb } from './db';
import { FIXTURE_CATALOG, FIXTURE_CREATORS, type FixtureCreator } from './fixtures';

function applyFiltersInMemory(
  cards: readonly AgentCard[],
  filters: CatalogFilters,
): AgentCard[] {
  let out = [...cards];
  if (filters.format) {
    out = out.filter((c) => c.primaryFormat === filters.format || c.formats.includes(filters.format!));
  }
  if (filters.category) {
    out = out.filter((c) => c.category === filters.category);
  }
  if (filters.tag) {
    out = out.filter((c) => c.tags.includes(filters.tag!));
  }
  if (filters.tool) {
    out = out.filter((c) => c.toolCompatibility.includes(filters.tool! as never));
  }
  if (filters.creatorLogin) {
    out = out.filter((c) => c.creatorLogin === filters.creatorLogin);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    out = out.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  const sort = filters.sort ?? (filters.query ? 'relevance' : 'most-installed');
  if (sort === 'recent') {
    out.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } else {
    out.sort((a, b) => b.installCount30d - a.installCount30d);
  }
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 20;
  return out.slice(offset, offset + limit);
}

export async function listAgents(filters: CatalogFilters = {}): Promise<AgentCard[]> {
  const db = getDb();
  if (!db) return applyFiltersInMemory(FIXTURE_CATALOG, filters);
  try {
    return await dbListAgents(db, filters);
  } catch {
    return applyFiltersInMemory(FIXTURE_CATALOG, filters);
  }
}

export async function getAgentBySlug(slug: string) {
  const db = getDb();
  if (!db) {
    const agent = FIXTURE_CATALOG.find((a) => a.id === slug);
    if (!agent) return null;
    const creator = agent.creatorLogin ? FIXTURE_CREATORS[agent.creatorLogin] ?? null : null;
    return { card: agent, creator, versions: [{ version: '1.0.0', publishedAt: agent.updatedAt }] };
  }
  try {
    const result = await dbGetAgentBySlug(db, slug);
    if (!result) return null;
    return {
      card: {
        id: result.agent.id,
        name: result.agent.name,
        description: result.agent.description,
        primaryFormat: result.agent.primaryFormat,
        formats: result.agent.formats,
        toolCompatibility: result.agent.toolCompatibility,
        category: result.agent.category,
        tags: result.agent.tags,
        license: result.agent.license,
        creatorLogin: result.creator?.githubLogin ?? null,
        sourceType: result.agent.sourceType,
        installCount30d: result.agent.installCount30d,
        installCountLifetime: result.agent.installCountLifetime,
        updatedAt: result.agent.updatedAt,
      },
      creator: result.creator
        ? {
            username: result.creator.githubLogin ?? 'unknown',
            displayName: result.creator.displayName ?? result.creator.githubLogin ?? 'unknown',
            bio: result.creator.bio ?? '',
            isVerifiedPublisher: result.creator.isVerifiedPublisher,
          }
        : null,
      versions: result.versions.map((v) => ({ version: v.version, publishedAt: v.publishedAt })),
    };
  } catch {
    const agent = FIXTURE_CATALOG.find((a) => a.id === slug);
    if (!agent) return null;
    const creator = agent.creatorLogin ? FIXTURE_CREATORS[agent.creatorLogin] ?? null : null;
    return { card: agent, creator, versions: [{ version: '1.0.0', publishedAt: agent.updatedAt }] };
  }
}

export async function searchAgents(query: string, filters: Omit<CatalogFilters, 'query'> = {}) {
  const db = getDb();
  if (!db) {
    const results = applyFiltersInMemory(FIXTURE_CATALOG, { ...filters, query });
    return results.map((r) => ({ ...r, score: r.installCount30d / 1000 }));
  }
  try {
    return await dbSearchAgents(db, query, filters);
  } catch {
    const results = applyFiltersInMemory(FIXTURE_CATALOG, { ...filters, query });
    return results.map((r) => ({ ...r, score: r.installCount30d / 1000 }));
  }
}

export async function getCreatorPage(username: string): Promise<{
  creator: FixtureCreator;
  agents: AgentCard[];
} | null> {
  const db = getDb();
  if (!db) {
    const creator = FIXTURE_CREATORS[username];
    if (!creator) return null;
    return {
      creator,
      agents: FIXTURE_CATALOG.filter((c) => c.creatorLogin === username),
    };
  }
  try {
    const result = await dbGetAgentByCreator(db, username);
    if (!result) return null;
    return {
      creator: {
        username: result.creator.githubLogin ?? username,
        displayName: result.creator.displayName ?? username,
        bio: result.creator.bio ?? '',
        isVerifiedPublisher: result.creator.isVerifiedPublisher,
      },
      agents: result.agents,
    };
  } catch {
    const creator = FIXTURE_CREATORS[username];
    if (!creator) return null;
    return {
      creator,
      agents: FIXTURE_CATALOG.filter((c) => c.creatorLogin === username),
    };
  }
}

export async function listCategories(): Promise<Array<{ category: string; count: number }>> {
  const db = getDb();
  if (!db) {
    const counts = new Map<string, number>();
    for (const c of FIXTURE_CATALOG) {
      if (c.category) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
  try {
    return await dbListCategories(db);
  } catch {
    const counts = new Map<string, number>();
    for (const c of FIXTURE_CATALOG) {
      if (c.category) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export interface CatalogStats {
  agents: number;
  publishers: number;
  installs30d: number;
}

// Real-count stats — bypasses the listAgents() limit-100 clamp by hitting
// count(*) / sum() directly against the agents table.
export async function getCatalogStats(): Promise<CatalogStats> {
  const db = getDb();
  if (!db) {
    return {
      agents: FIXTURE_CATALOG.length,
      publishers: new Set(
        FIXTURE_CATALOG.map((a) => a.creatorLogin).filter(Boolean),
      ).size,
      installs30d: FIXTURE_CATALOG.reduce((acc, a) => acc + a.installCount30d, 0),
    };
  }
  try {
    const [row] = await db
      .select({
        agents: sql<number>`count(*)::int`,
        publishers: sql<number>`count(distinct ${agents.creatorId})::int`,
        installs30d: sql<number>`coalesce(sum(${agents.installCount30d}), 0)::int`,
      })
      .from(agents)
      .where(sql`${agents.unpublishedAt} IS NULL`);
    return {
      agents: row?.agents ?? 0,
      publishers: row?.publishers ?? 0,
      installs30d: row?.installs30d ?? 0,
    };
  } catch {
    return {
      agents: FIXTURE_CATALOG.length,
      publishers: 0,
      installs30d: 0,
    };
  }
}

export type { AgentCard, SearchResult };
