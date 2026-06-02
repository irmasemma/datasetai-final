// E5.10 — periodic mirror refresh. Walks each registered SourceAdapter, normalizes listings,
// upserts agents while preserving source attribution and license. Suppression check happens
// before persistence so suppressed upstreams are never re-mirrored.
//
// Blocked licenses (Proprietary / Commercial-only) skip persistence per E5.11 license preservation.

import { isMirrorAllowedLicense } from '@datasetai/format-adapters';
import {
  agents,
  agentVersions,
  isAgentSuppressed,
  type Database,
  type NewAgent,
} from '@datasetai/db';
import type { SourceAdapter } from '@datasetai/source-adapters';
import { eq } from 'drizzle-orm';

export interface RefreshMirrorsResult {
  readonly source: string;
  readonly inserted: number;
  readonly updated: number;
  readonly skippedSuppressed: number;
  readonly skippedLicense: number;
  readonly errors: readonly string[];
}

export interface RefreshMirrorsDeps {
  readonly db: Database;
  readonly adapters: readonly SourceAdapter[];
  readonly contentBaseUrl: string;
}

export async function refreshMirrors(deps: RefreshMirrorsDeps): Promise<RefreshMirrorsResult[]> {
  const results: RefreshMirrorsResult[] = [];
  for (const adapter of deps.adapters) {
    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;
    let skippedSuppressed = 0;
    let skippedLicense = 0;
    try {
      for await (const raw of adapter.fetchListings()) {
        const normalized = adapter.normalize(raw);
        if (!isMirrorAllowedLicense(normalized.license)) {
          skippedLicense += 1;
          continue;
        }
        if (await isAgentSuppressed(deps.db, normalized.id)) {
          skippedSuppressed += 1;
          continue;
        }

        const [existing] = await deps.db
          .select()
          .from(agents)
          .where(eq(agents.id, normalized.id))
          .limit(1);

        const newAgent: NewAgent = {
          id: normalized.id,
          name: normalized.name,
          description: normalized.description,
          longDescription: normalized.longDescription ?? null,
          category: normalized.category ?? null,
          tags: [...normalized.tags],
          primaryFormat: normalized.primaryFormat,
          formats: [...normalized.formats],
          toolCompatibility: [...normalized.toolCompatibility],
          license: normalized.license,
          sourceType: normalized.sourceType,
          sourceUrl: normalized.sourceUrl,
          sourceAttribution: {
            ...(normalized.authorHandle ? { authorHandle: normalized.authorHandle } : {}),
            mirroredAt: new Date().toISOString(),
          },
          currentVersion: '1.0.0',
        };

        if (!existing) {
          await deps.db.insert(agents).values(newAgent);
          await deps.db.insert(agentVersions).values({
            agentId: normalized.id,
            version: '1.0.0',
            contentHash: normalized.contentHash,
            contentSizeBytes: 0,
            manifestUrl: `${deps.contentBaseUrl}/agents/${encodeURIComponent(normalized.id)}/1.0.0.json`,
            contentUrl: `${deps.contentBaseUrl}/content/${normalized.contentHash}.tar.gz`,
            format: normalized.primaryFormat,
          });
          inserted += 1;
        } else if (existing.sourceType === normalized.sourceType) {
          await deps.db
            .update(agents)
            .set({
              name: normalized.name,
              description: normalized.description,
              longDescription: normalized.longDescription ?? null,
              tags: [...normalized.tags],
              primaryFormat: normalized.primaryFormat,
              formats: [...normalized.formats],
              toolCompatibility: [...normalized.toolCompatibility],
              license: normalized.license,
              category: normalized.category ?? null,
              sourceUrl: normalized.sourceUrl,
              sourceAttribution: {
                ...(normalized.authorHandle ? { authorHandle: normalized.authorHandle } : {}),
                mirroredAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(agents.id, normalized.id));
          updated += 1;
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
    results.push({
      source: adapter.id,
      inserted,
      updated,
      skippedSuppressed,
      skippedLicense,
      errors,
    });
  }
  return results;
}

export const REFRESH_MIRRORS_JOB = 'refresh-mirrors' as const;
