// E4.10 — async manifest publish job. Reads pending publish_jobs row, regenerates the canonical
// manifest, signs it with the platform Ed25519 key, uploads to storage, marks job complete.

import {
  signManifest,
  type ContentStorage,
  type Job,
  type UnsignedManifest,
  type FormatId,
  type ToolId,
} from '@datasetai/core';
import {
  agents,
  agentVersions,
  publishJobs,
  type Database,
} from '@datasetai/db';
import { and, eq } from 'drizzle-orm';

export interface PublishManifestPayload {
  readonly jobId: string;
  readonly agentId: string;
  readonly version: string;
}

export interface PublishManifestDeps {
  readonly db: Database;
  readonly storage: ContentStorage;
  readonly signingKey: Uint8Array;
  readonly keyId: string;
  readonly publicCdnBase: string;
}

export function createPublishManifestHandler(
  deps: PublishManifestDeps,
): (job: Job<PublishManifestPayload>) => Promise<void> {
  return async (job) => {
    const { agentId, version } = job.payload;
    const [agent] = await deps.db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    if (!agent) throw new Error(`agent ${agentId} not found`);
    const [agentVersion] = await deps.db
      .select()
      .from(agentVersions)
      .where(and(eq(agentVersions.agentId, agentId), eq(agentVersions.version, version)))
      .limit(1);
    if (!agentVersion) throw new Error(`agent version ${agentId}@${version} not found`);

    const unsigned: UnsignedManifest = {
      schemaVersion: 1,
      id: agent.id,
      version: agentVersion.version,
      name: agent.name,
      description: agent.description,
      format: agentVersion.format as FormatId,
      formats: agent.formats as readonly FormatId[],
      toolCompatibility: agent.toolCompatibility as readonly ToolId[],
      ...(agent.license ? { license: agent.license } : {}),
      contentUrl: agentVersion.contentUrl,
      contentHash: agentVersion.contentHash,
      contentSize: agentVersion.contentSizeBytes,
      ...(agent.sourceUrl
        ? {
            attribution: {
              sourceName: agent.sourceType,
              sourceUrl: agent.sourceUrl,
              ...(agent.sourceAttribution &&
              typeof (agent.sourceAttribution as Record<string, unknown>)['authorHandle'] === 'string'
                ? {
                    authorHandle: (agent.sourceAttribution as Record<string, string>)[
                      'authorHandle'
                    ]!,
                  }
                : {}),
            },
          }
        : {}),
      publishedAt: agentVersion.publishedAt.toISOString(),
    };

    const signed = signManifest(unsigned, deps.signingKey, deps.keyId);
    const json = `${JSON.stringify(signed, null, 2)}\n`;

    const versionPut = await deps.storage.putManifest(agent.id, agentVersion.version, json);
    await deps.storage.putLatestPointer(agent.id, json);

    await deps.db
      .update(agentVersions)
      .set({ manifestUrl: versionPut.url })
      .where(and(eq(agentVersions.agentId, agentId), eq(agentVersions.version, version)));

    await deps.db
      .update(publishJobs)
      .set({ status: 'completed', completedAt: new Date(), attempts: job.attempts })
      .where(eq(publishJobs.id, job.payload.jobId));
  };
}

export const PUBLISH_MANIFEST_JOB = 'publish-manifest' as const;
