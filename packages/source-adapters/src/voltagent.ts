// VoltAgent / awesome-agent-skills mirror (story E5.3).
// Pulls the README.md from GitHub raw, parses skill entries from bullet lists,
// and attaches the nearest heading as `category` (h3 wins over h2).
//
// Real upstream uses two heading styles:
//   ## Section title              ← regular markdown h2
//   <summary><h3>Sub-section</h3></summary>  ← collapsible section's h3
// We track both and use the most-specific one above each entry.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_README =
  'https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md';

interface Entry {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly category?: string;
}

export interface VoltAgentAdapterOptions {
  readonly readmeUrl?: string;
  readonly fetch?: FetchLike;
}

// Entry lines accept (in any combination):
//   - [name](url) - desc
//   - **[name](url)** - desc          ← VoltAgent's actual format (bold-wrapped names)
//   - **[name](url)** — desc
//   * [name](url): desc
const ENTRY_LINE =
  /^[-*]\s+(?:\*\*|__)?\[([^\]]+)\]\(([^)]+)\)(?:\*\*|__)?\s*[-—:]?\s*(.*)$/;

// Section headings we track:
const H2 = /^##\s+(.+?)\s*$/;
const H3 = /^###\s+(.+?)\s*$/;
// <summary><h3 style="display:inline">Title</h3></summary> — VoltAgent's collapsible group pattern.
const SUMMARY_H3 = /<summary[^>]*>(?:[\s\S]*?)<h3[^>]*>([^<]+)<\/h3>/i;
// Plain <summary>Title</summary> — a fallback when there's no inline h3.
const SUMMARY_PLAIN = /<summary[^>]*>([^<]+?)<\/summary>/i;

function isExternalLink(url: string): boolean {
  if (!url.startsWith('http')) return false;
  if (url.includes('img.shields.io')) return false;
  if (url.includes('awesome.re')) return false;
  return true;
}

// Strip emoji + leading numbering ("01. ", "🔥 ") from heading text.
function cleanHeading(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[*_]+/g, '')
    .replace(/^[\d.\s]+/, '')
    .trim();
}

export function parseVoltAgentReadme(markdown: string): Entry[] {
  const entries: Entry[] = [];
  const seen = new Set<string>();
  let currentH2: string | null = null;
  let currentH3: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const h2 = H2.exec(line);
    if (h2) {
      currentH2 = cleanHeading(h2[1]!);
      currentH3 = null;
      continue;
    }
    const h3 = H3.exec(line);
    if (h3) {
      currentH3 = cleanHeading(h3[1]!);
      continue;
    }
    const sumH3 = SUMMARY_H3.exec(line);
    if (sumH3) {
      currentH3 = cleanHeading(sumH3[1]!);
      continue;
    }
    const sumPlain = SUMMARY_PLAIN.exec(line);
    if (sumPlain && !sumH3) {
      currentH3 = cleanHeading(sumPlain[1]!);
      continue;
    }

    const m = ENTRY_LINE.exec(line);
    if (!m) continue;
    const [, name, url, desc] = m;
    if (!name || !url) continue;
    if (!isExternalLink(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    const category = currentH3 ?? currentH2 ?? undefined;
    entries.push({
      name: name.trim(),
      url: url.trim(),
      description: desc?.trim() ?? '',
      ...(category ? { category } : {}),
    });
  }
  return entries;
}

// Slugify a heading into a category id: "Official Claude Skills" → "official-claude-skills".
export function categoryFromHeading(heading: string | undefined): string {
  if (!heading) return 'mirrored';
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'mirrored';
}

// Heuristic format detection from URL + name + heading. The README is curated
// for "agent skills" so we default to claude-skill, but flag MCP servers and
// cross-format collections explicitly.
export function detectFormat(e: Entry): {
  primaryFormat: 'claude-skill' | 'mcp-server' | 'cursorrules' | 'agents-md';
  formats: ReadonlyArray<'claude-skill' | 'mcp-server' | 'cursorrules' | 'agents-md'>;
  toolCompatibility: ReadonlyArray<string>;
} {
  const haystack = `${e.url} ${e.name} ${e.category ?? ''}`.toLowerCase();

  if (/\bmcp[- ]server|\bmcp\b|model[- ]context[- ]protocol/i.test(haystack)) {
    return {
      primaryFormat: 'mcp-server',
      formats: ['mcp-server'],
      // MCP is the cross-LLM substrate.
      toolCompatibility: ['claude-code', 'claude-desktop', 'cursor', 'codex-cli', 'gemini-cli'],
    };
  }
  if (/cursorrules|cursor\.directory/.test(haystack)) {
    return {
      primaryFormat: 'cursorrules',
      formats: ['cursorrules'],
      toolCompatibility: ['cursor'],
    };
  }
  if (/agents\.md|\bagents-md\b/.test(haystack)) {
    return {
      primaryFormat: 'agents-md',
      formats: ['agents-md'],
      toolCompatibility: ['claude-code', 'cursor', 'codex-cli', 'aider'],
    };
  }
  // Default — Claude skill, single-tool. The README's whole premise.
  return {
    primaryFormat: 'claude-skill',
    formats: ['claude-skill'],
    toolCompatibility: ['claude-code'],
  };
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
      const category = categoryFromHeading(e.category);
      const fmt = detectFormat(e);
      const tags = ['voltagent', 'mirror'];
      if (category !== 'mirrored') tags.push(category);
      return {
        id: slug,
        name: e.name,
        description: e.description || `Mirrored skill: ${e.name}`,
        primaryFormat: fmt.primaryFormat,
        formats: fmt.formats,
        toolCompatibility: fmt.toolCompatibility,
        category,
        tags,
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
