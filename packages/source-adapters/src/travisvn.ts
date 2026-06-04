// travisvn/awesome-claude-skills mirror.
// Parses bullet-link entries from the README — curated skills list.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_README =
  'https://raw.githubusercontent.com/travisvn/awesome-claude-skills/main/README.md';

interface Entry {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly category?: string;
}

export interface TravisvnAdapterOptions {
  readonly readmeUrl?: string;
  readonly fetch?: FetchLike;
}

const ENTRY_LINE =
  /^[-*]\s+(?:\*{1,2}|__)?\[([^\]]+)\]\(([^)]+)\)(?:\*{1,2}|__)?\s*[-—:]?\s*(.*)$/;

const H2 = /^##\s+(.+?)\s*$/;
const H3 = /^###\s+(.+?)\s*$/;

function isExternalLink(url: string): boolean {
  if (!url.startsWith('http')) return false;
  if (url.includes('img.shields.io')) return false;
  if (url.includes('awesome.re')) return false;
  return true;
}

function cleanHeading(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[*_]+/g, '')
    .replace(/^[\d.\s]+/, '')
    .trim();
}

export function createTravisvnAdapter(opts: TravisvnAdapterOptions = {}): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const readmeUrl = opts.readmeUrl ?? DEFAULT_README;

  async function* fetchListings(): AsyncIterable<RawListing> {
    const res = await fetchFn(readmeUrl);
    if (!res.ok) throw new Error(`travisvn README fetch failed: HTTP ${res.status}`);
    const text = await res.text();
    const entries = parseReadme(text);
    for (const entry of entries) {
      yield {
        source: 'travisvn-mirror',
        upstreamId: entry.url,
        upstreamUrl: entry.url,
        raw: entry,
      };
    }
  }

  return {
    id: 'travisvn-mirror' as any,
    label: 'travisvn / awesome-claude-skills',
    fetchListings,
    normalize(raw): NormalizedListing {
      const e = raw.raw as Entry;
      const slug = `travisvn/${slugify(e.name)}`;
      return {
        id: slug,
        name: e.name,
        description: e.description || `Curated skill: ${e.name}`,
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code', 'cursor'],
        category: e.category ?? 'development',
        tags: ['travisvn', 'curated', e.category ?? 'skill'].filter(Boolean),
        license: 'MIT',
        sourceType: 'travisvn-mirror' as any,
        sourceUrl: e.url,
        authorHandle: extractGitHubOwner(e.url) ?? 'travisvn',
        contentHash: sha256Hex(`travisvn:${slug}:${e.url}`),
      };
    },
  };
}

function parseReadme(markdown: string): Entry[] {
  const entries: Entry[] = [];
  const seen = new Set<string>();
  let currentH2: string | null = null;
  let currentH3: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const h2 = H2.exec(line);
    if (h2) { currentH2 = cleanHeading(h2[1]!); currentH3 = null; continue; }
    const h3 = H3.exec(line);
    if (h3) { currentH3 = cleanHeading(h3[1]!); continue; }

    const m = ENTRY_LINE.exec(line);
    if (!m) continue;
    const [, name, url, desc] = m;
    if (!name || !url) continue;
    if (!isExternalLink(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    entries.push({
      name: name.trim(),
      url: url.trim(),
      description: desc?.trim() ?? '',
      category: currentH3 ?? currentH2 ?? undefined,
    });
  }
  return entries;
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'unnamed';
}

function extractGitHubOwner(url: string): string | undefined {
  const m = /github\.com\/([^/]+)/.exec(url);
  return m?.[1];
}
