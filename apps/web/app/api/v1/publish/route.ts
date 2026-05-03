// POST /api/v1/publish — story E4.2 web upload entry point.
// Multipart/form-data: name, slug, summary, description, license, category, tags[], formats[],
// readme, version, files[].
// The handler is exported separately (publishHandler) so tests can call it with a constructed
// session and a fake fetch shape.

import {
  type AuthSession,
  type FormatId,
} from '@datasetai/core';
import { NextResponse } from 'next/server';
import { publishAgent } from '../../../../lib/publish';
import { getDb } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { getWorkerBundle } from '../../../../lib/worker';

interface FormFileLike {
  readonly name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface PublishRequestPayload {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly readme: string;
  readonly license: string;
  readonly category?: string | null;
  readonly tags?: readonly string[];
  readonly formats?: readonly FormatId[];
  readonly version: string;
  readonly files: readonly { path: string; content: Uint8Array }[];
  readonly changelog?: string;
}

export async function publishHandler(
  session: AuthSession | null,
  payload: PublishRequestPayload,
): Promise<Response> {
  if (!session) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 503 });
  const bundle = getWorkerBundle();
  const result = await publishAgent(
    session,
    {
      slug: payload.slug,
      name: payload.name,
      summary: payload.summary,
      description: payload.description,
      readme: payload.readme,
      license: payload.license,
      category: payload.category ?? null,
      tags: payload.tags ?? [],
      formats: payload.formats,
      version: payload.version,
      files: payload.files,
      ...(payload.changelog ? { changelog: payload.changelog } : {}),
    },
    {
      db,
      storage: bundle.storage,
      queue: bundle.queue,
      signingKey: bundle.signingKey,
      keyId: bundle.keyId,
      publicCdnBase: bundle.publicCdnBase,
    },
  );

  if (!result.ok) {
    const status =
      result.code === 'AUTH_REQUIRED'
        ? 401
        : result.code === 'TOS_NOT_ACCEPTED'
          ? 403
          : result.code === 'SLUG_TAKEN'
            ? 409
            : result.code === 'VERSION_EXISTS'
              ? 409
              : 422;
    return NextResponse.json(
      { error: result.code, message: result.message, lint: result.lint },
      { status },
    );
  }
  return NextResponse.json({
    ok: true,
    slug: result.slug,
    version: result.version,
    contentHash: result.contentHash,
    manifestUrl: `/agents/${encodeURIComponent(result.slug)}/${result.version}.json`,
    lint: result.lint,
  });
}

export async function POST(req: Request): Promise<Response> {
  const ct = req.headers.get('content-type') ?? '';
  let payload: PublishRequestPayload;
  if (ct.startsWith('application/json')) {
    payload = (await req.json()) as PublishRequestPayload;
  } else if (ct.startsWith('multipart/form-data')) {
    const fd = await req.formData();
    const fileEntries = fd.getAll('files') as unknown as FormFileLike[];
    const files: { path: string; content: Uint8Array }[] = [];
    for (const f of fileEntries) {
      if (!f || typeof f.arrayBuffer !== 'function') continue;
      const buf = new Uint8Array(await f.arrayBuffer());
      files.push({ path: f.name, content: buf });
    }
    payload = {
      slug: String(fd.get('slug') ?? ''),
      name: String(fd.get('name') ?? ''),
      summary: String(fd.get('summary') ?? ''),
      description: String(fd.get('description') ?? ''),
      readme: String(fd.get('readme') ?? ''),
      license: String(fd.get('license') ?? ''),
      category: (fd.get('category') as string | null) ?? null,
      tags: (fd.getAll('tags') as string[]) ?? [],
      formats: ((fd.getAll('formats') as string[]) ?? []) as FormatId[],
      version: String(fd.get('version') ?? '0.1.0'),
      files,
      changelog: (fd.get('changelog') as string | null) ?? undefined,
    };
  } else {
    return NextResponse.json({ error: 'unsupported content-type' }, { status: 415 });
  }
  const session = await getSession();
  return publishHandler(session, payload);
}
