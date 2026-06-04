// Anthropic official marketplace mirror (anthropics/claude-plugins-official).
// Parses the structured marketplace.json — highest quality source, verified plugins.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_URL =
  'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json';

interface MarketplacePlugin {
  readonly name: string;
  readonly description: string;
  readonly author?: { readonly name?: string; readonly email?: string };
  readonly category?: string;
  readonly source?: unknown;
  readonly homepage?: string;
}

export interface AnthropicMarketplaceAdapterOptions {
  readonly marketplaceUrl?: string;
  readonly fetch?: FetchLike;
}

export function createAnthropicMarketplaceAdapter(
  opts: AnthropicMarketplaceAdapterOptions = {},
): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const marketplaceUrl = opts.marketplaceUrl ?? DEFAULT_URL;

  async function* fetchListings(): AsyncIterable<RawListing> {
    const res = await fetchFn(marketplaceUrl);
    if (!res.ok) throw new Error(`Anthropic marketplace fetch failed: HTTP ${res.status}`);
    const text = await res.text();
    const data = JSON.parse(text) as { plugins: MarketplacePlugin[] };

    for (const plugin of data.plugins) {
      if (!plugin.name || !plugin.description) continue;
      const homepage = plugin.homepage ?? '';
      yield {
        source: 'anthropic-marketplace',
        upstreamId: plugin.name,
        upstreamUrl: homepage,
        raw: plugin,
      };
    }
  }

  return {
    id: 'anthropic-marketplace' as any,
    label: 'Anthropic Official Marketplace',
    fetchListings,
    normalize(raw): NormalizedListing {
      const p = raw.raw as MarketplacePlugin;
      const slug = `anthropic/${slugify(p.name)}`;
      const authorName = p.author?.name ?? 'Anthropic';
      const category = p.category ?? 'development';
      const sourceUrl = p.homepage ?? `https://github.com/anthropics/claude-plugins-official`;

      return {
        id: slug,
        name: p.name,
        description: p.description,
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code'],
        category,
        tags: ['anthropic', 'official', 'marketplace', category].filter(Boolean),
        license: 'MIT',
        sourceType: 'anthropic-marketplace' as any,
        sourceUrl,
        authorHandle: authorName.toLowerCase().replace(/\s+/g, '-'),
        contentHash: sha256Hex(`anthropic:${slug}:${p.description.slice(0, 200)}`),
      };
    },
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'unnamed';
}
