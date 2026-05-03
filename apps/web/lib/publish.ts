// Publish pipeline (stories E4.2 + E4.3 + E4.4 + E4.5 + E4.8 + E7.5).
// Pure functions over injected dependencies — the API route wires real DB/storage/queue,
// tests pass tmpdirs and an in-memory queue.

import {
  signManifest,
  type AuthSession,
  type ContentStorage,
  type FormatId,
  type JobQueue,
  type SignedManifest,
  type ToolId,
  type UnsignedManifest,
} from '@datasetai/core';
import {
  agents,
  agentVersions,
  publishJobs,
  users,
  type Database,
} from '@datasetai/db';
import {
  autoDetectFormats,
  createAdapterRegistry,
  lintPublish,
  type LintReport,
} from '@datasetai/format-adapters';
import type { AgentFile } from '@datasetai/format-adapters';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';

export interface PublishInput {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly readme: string;
  readonly license: string;
  readonly category: string | null;
  readonly tags: readonly string[];
  /** When omitted, auto-detect runs. */
  readonly formats?: readonly FormatId[];
  readonly toolCompatibility?: readonly ToolId[];
  readonly version: string;
  readonly files: readonly AgentFile[];
  readonly changelog?: string;
}

export interface PublishDeps {
  readonly db: Database;
  readonly storage: ContentStorage;
  readonly queue: JobQueue;
  readonly signingKey: Uint8Array;
  readonly keyId: string;
  readonly publicCdnBase: string;
}

export type PublishResult =
  | {
      readonly ok: true;
      readonly slug: string;
      readonly version: string;
      readonly contentHash: string;
      readonly manifest: SignedManifest;
      readonly jobId: string;
      readonly lint: LintReport;
    }
  | {
      readonly ok: false;
      readonly code:
        | 'AUTH_REQUIRED'
        | 'TOS_NOT_ACCEPTED'
        | 'LINT_FAILED'
        | 'SLUG_TAKEN'
        | 'VERSION_EXISTS';
      readonly message: string;
      readonly lint?: LintReport;
    };

const TARBALL_PSEUDO_PREFIX = 'datasetai-pseudo-tarball/';

export function buildPseudoTarball(files: readonly AgentFile[]): Uint8Array {
  // Avoids depending on tar at the API boundary. Uses a deterministic concat for content hashing.
  // Real tar packing happens client-side or in the worker; the API stores this blob and the
  // worker re-packs when needed. Round-2 acceptable trade-off.
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    parts.push(enc.encode(`${TARBALL_PSEUDO_PREFIX}${f.path}\n${f.content.byteLength}\n`));
    parts.push(f.content);
    parts.push(enc.encode('\n'));
  }
  let total = 0;
  for (const p of parts) total += p.byteLength;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

export function hashContent(bytes: Uint8Array): string {
  const h = createHash('sha256');
  h.update(bytes);
  const buf = h.digest();
  let hex = '';
  for (let i = 0; i < buf.length; i++) hex += buf[i]!.toString(16).padStart(2, '0');
  return hex;
}

export async function publishAgent(
  session: AuthSession,
  input: PublishInput,
  deps: PublishDeps,
): Promise<PublishResult> {
  // ToS gate (E4.1 acceptance: "acceptance of ToS + Privacy + Creator Agreement gates the first
  // publish"). We accept the gate here since the form forwards the timestamps.
  const [user] = await deps.db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return { ok: false, code: 'AUTH_REQUIRED', message: 'Session user not found.' };
  if (!user.acceptedTosAt || !user.acceptedPrivacyAt || !user.acceptedCreatorAgreementAt) {
    return {
      ok: false,
      code: 'TOS_NOT_ACCEPTED',
      message: 'Accept ToS, Privacy, and Creator Agreement before publishing.',
    };
  }

  // Slug ownership check — once published, only the original creator can re-publish.
  const [existing] = await deps.db.select().from(agents).where(eq(agents.id, input.slug)).limit(1);
  if (existing && existing.creatorId && existing.creatorId !== session.userId) {
    return { ok: false, code: 'SLUG_TAKEN', message: `Slug ${input.slug} is owned by another user.` };
  }
  if (existing) {
    const [versionRow] = await deps.db
      .select()
      .from(agentVersions)
      .where(eq(agentVersions.agentId, input.slug))
      .limit(1);
    void versionRow;
    const [versionCheck] = await deps.db
      .select()
      .from(agentVersions)
      .where(eq(agentVersions.agentId, input.slug))
      .limit(50);
    if (versionCheck && versionCheck.version === input.version) {
      return {
        ok: false,
        code: 'VERSION_EXISTS',
        message: `Version ${input.version} already exists for ${input.slug}.`,
      };
    }
  }

  const filesWithReadme: AgentFile[] = [
    { path: 'README.md', content: new TextEncoder().encode(input.readme) },
    ...input.files,
  ];

  const registry = createAdapterRegistry({
    readFile: async () => null,
    writeFile: async () => undefined,
    mkdir: async () => undefined,
  });
  const detected = autoDetectFormats(filesWithReadme, registry);
  const formats = (input.formats && input.formats.length > 0 ? input.formats : detected.formats) as FormatId[];

  const lint = lintPublish(
    {
      content: { files: filesWithReadme },
      formats,
      license: input.license,
    },
    registry,
  );
  if (lint.errors.length > 0) {
    return { ok: false, code: 'LINT_FAILED', message: 'Lint errors blocked publish.', lint };
  }

  const tarball = buildPseudoTarball(filesWithReadme);
  const contentHash = hashContent(tarball);

  if (!(await deps.storage.has(contentHash))) {
    await deps.storage.putContent(contentHash, tarball);
  }

  const primaryFormat = formats[0] ?? detected.primary;
  const toolCompatibility = (input.toolCompatibility && input.toolCompatibility.length > 0
    ? input.toolCompatibility
    : derivedToolCompatibility(formats, registry)) as ToolId[];

  const contentUrl = `${deps.publicCdnBase}/content/${contentHash}.tar.gz`;
  const manifestUrl = `${deps.publicCdnBase}/agents/${encodeURIComponent(input.slug)}/${input.version}.json`;

  if (existing) {
    await deps.db
      .update(agents)
      .set({
        name: input.name,
        description: input.summary,
        longDescription: input.description,
        category: input.category,
        tags: [...input.tags],
        primaryFormat,
        formats: [...formats],
        toolCompatibility: [...toolCompatibility],
        license: input.license,
        currentVersion: input.version,
        updatedAt: new Date(),
        unpublishedAt: null,
      })
      .where(eq(agents.id, input.slug));
  } else {
    await deps.db.insert(agents).values({
      id: input.slug,
      name: input.name,
      description: input.summary,
      longDescription: input.description,
      category: input.category,
      tags: [...input.tags],
      primaryFormat,
      formats: [...formats],
      toolCompatibility: [...toolCompatibility],
      license: input.license,
      sourceType: 'direct-publish',
      creatorId: session.userId,
      currentVersion: input.version,
    });
  }

  await deps.db.insert(agentVersions).values({
    agentId: input.slug,
    version: input.version,
    contentHash,
    contentSizeBytes: tarball.byteLength,
    manifestUrl,
    contentUrl,
    changelog: input.changelog ?? null,
    format: primaryFormat,
  });

  const unsigned: UnsignedManifest = {
    schemaVersion: 1,
    id: input.slug,
    version: input.version,
    name: input.name,
    description: input.summary,
    format: primaryFormat,
    formats,
    toolCompatibility,
    license: input.license,
    contentUrl,
    contentHash,
    contentSize: tarball.byteLength,
    publishedAt: new Date().toISOString(),
  };
  const signed = signManifest(unsigned, deps.signingKey, deps.keyId);
  const json = `${JSON.stringify(signed, null, 2)}\n`;
  await deps.storage.putManifest(input.slug, input.version, json);
  await deps.storage.putLatestPointer(input.slug, json);

  const [jobRow] = await deps.db
    .insert(publishJobs)
    .values({ agentId: input.slug, version: input.version, status: 'pending' })
    .returning({ id: publishJobs.id });
  const jobId = jobRow!.id;
  await deps.queue.enqueue('publish-manifest', {
    jobId,
    agentId: input.slug,
    version: input.version,
  });

  return {
    ok: true,
    slug: input.slug,
    version: input.version,
    contentHash,
    manifest: signed,
    jobId,
    lint,
  };
}

function derivedToolCompatibility(
  formats: readonly FormatId[],
  registry: ReturnType<typeof createAdapterRegistry>,
): ToolId[] {
  const tools = new Set<ToolId>();
  for (const formatId of formats) {
    const adapter = registry.byId(formatId);
    if (!adapter) continue;
    for (const t of adapter.toolCompatibility()) tools.add(t);
  }
  return [...tools];
}
