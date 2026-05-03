// VoltAgent / awesome-agent-skills mirror (story E5.3).
// Pulls the README.md from GitHub raw and parses skill entries out of bullet lists.
// Tests inject a local fetch pointing at a fixture server.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_README =
  'https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md';

interface Entry {
  readonly name: string;
  readonly description: string;
  readonly url: string;
}

export interface VoltAgentAdapterOptions {
  readonly readmeUrl?: string;
  readonly fetch?: FetchLike;
}

const ENTRY_LINE = /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-—:]?\s*(.*)$/;

export function parseVoltAgentReadme(markdown: string): Entry[] {
  const entries: Entry[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const m = ENTRY_LINE.exec(line);
    if (!m) continue;
    const [, name, url, desc] = m;
    if (!name || !url) continue;
    if (!url.startsWith('http')) continue;
    entries.push({ name: name.trim(), url: url.trim(), description: desc?.trim() ?? '' });
  }
  return entries;
}

export function createVoltAgentAdapter(opts: VoltAgentAdapterOptions = {}): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const readmeUrl = opts.readmeUrl ?? DEFAULT_README;

  async function* fetchListings(): AsyncIterable<RawListing> {
    const res = await fetchFn(readmeUrl);
    if (!res.ok) throw new Error(`VoltAgent README fetch failed: HTTP ${res.status}`);
    const text = await res.text();
    const entries = parseVoltAgentReadme(text);
    for (const entry of entries) {
      yield {
        source: 'voltagent-mirror',
        upstreamId: entry.url,
        upstreamUrl: entry.url,
        raw: entry,
      };
    }
  }

  return {
    id: 'voltagent-mirror',
    label: 'VoltAgent / awesome-agent-skills',
    fetchListings,
    normalize(raw): NormalizedListing {
      const e = raw.raw as Entry;
      const slug = `voltagent/${slugify(e.name)}`;
      return {
        id: slug,
        name: e.name,
        description: e.description || `Mirrored skill: ${e.name}`,
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code'],
        category: 'mirrored',
        tags: ['voltagent', 'mirror'],
        license: 'MIT',
        sourceType: 'voltagent-mirror',
        sourceUrl: e.url,
        authorHandle: extractGitHubOwner(e.url) ?? 'voltagent',
        contentHash: sha256Hex(`voltagent:${slug}:${e.url}`),
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

function extractGitHubOwner(url: string): string | undefined {
  const m = /github\.com\/([^/]+)/.exec(url);
  return m?.[1];
}
