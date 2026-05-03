// Smithery metadata-only mirror (story E5.5).
// Smithery doesn't expose a stable public catalog endpoint at the time of writing; we keep this
// adapter as a typed stub that throws with a clear configuration message until the env var
// `SMITHERY_REGISTRY_URL` is set and the response shape is finalized.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

interface SmitheryEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly homepage?: string;
  readonly license?: string;
}

export interface SmitheryAdapterOptions {
  readonly registryUrl?: string;
  readonly fetch?: FetchLike;
}

export function createSmitheryAdapter(opts: SmitheryAdapterOptions = {}): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const registryUrl = opts.registryUrl ?? process.env['SMITHERY_REGISTRY_URL'];

  async function* fetchListings(): AsyncIterable<RawListing> {
    if (!registryUrl) {
      throw new Error(
        'NOT_IMPLEMENTED: Smithery adapter requires SMITHERY_REGISTRY_URL to be set. The public ' +
          'catalog API is not yet finalized.',
      );
    }
    const res = await fetchFn(registryUrl);
    if (!res.ok) throw new Error(`Smithery registry fetch failed: HTTP ${res.status}`);
    const body = JSON.parse(await res.text()) as { servers?: SmitheryEntry[] };
    for (const entry of body.servers ?? []) {
      yield {
        source: 'smithery-mirror',
        upstreamId: entry.id,
        upstreamUrl: entry.homepage ?? `https://smithery.ai/server/${entry.id}`,
        raw: entry,
      };
    }
  }

  return {
    id: 'smithery-mirror',
    label: 'Smithery (MCP servers — metadata only)',
    fetchListings,
    normalize(raw): NormalizedListing {
      const e = raw.raw as SmitheryEntry;
      const id = `smithery/${slugify(e.id)}`;
      return {
        id,
        name: e.name,
        description: e.description,
        primaryFormat: 'mcp-server',
        formats: ['mcp-server'],
        toolCompatibility: ['claude-desktop', 'cursor'],
        category: 'mcp',
        tags: ['smithery', 'mcp'],
        license: e.license ?? 'Unknown',
        sourceType: 'smithery-mirror',
        sourceUrl: e.homepage ?? `https://smithery.ai/server/${e.id}`,
        contentHash: sha256Hex(`smithery:${id}:${e.id}`),
      };
    },
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'unnamed'
  );
}
