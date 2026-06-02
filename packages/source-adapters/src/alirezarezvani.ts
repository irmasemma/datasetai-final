// alirezarezvani/claude-skills mirror (story E5.4).
// Strategy: fetch the repo's tree via GitHub API and treat each top-level skill folder as one
// listing. Tests inject a fetch pointing at a local fixture.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_TREE =
  'https://api.github.com/repos/alirezarezvani/claude-skills/git/trees/main?recursive=1';

interface TreeEntry {
  readonly path: string;
  readonly type: string;
  readonly sha: string;
}

interface Listing {
  readonly path: string;
  readonly sha: string;
  readonly url: string;
}

export interface AlirezarezvaniAdapterOptions {
  readonly treeUrl?: string;
  readonly fetch?: FetchLike;
  readonly token?: string;
}

// Names that appear as files inside skill directories but are not actual skills
// (template scaffolding, contributor docs, repo-level READMEs).
const META_NAMES = new Set(['readme', 'template', '_template', 'example', '.template']);

export function extractSkillFolders(tree: readonly TreeEntry[]): string[] {
  const folders = new Set<string>();
  for (const entry of tree) {
    if (entry.type !== 'blob') continue;
    if (!entry.path.toLowerCase().endsWith('skill.md')) continue;
    const parts = entry.path.split('/');
    if (parts.length < 2) continue;
    const folder = parts.slice(0, -1).join('/');
    // Skip folders whose final segment is a meta name (README, TEMPLATE, etc.)
    const leaf = parts[parts.length - 2];
    if (leaf && META_NAMES.has(leaf.toLowerCase())) continue;
    folders.add(folder);
  }
  return Array.from(folders);
}

export function createAlirezarezvaniAdapter(
  opts: AlirezarezvaniAdapterOptions = {},
): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const treeUrl = opts.treeUrl ?? DEFAULT_TREE;

  async function* fetchListings(): AsyncIterable<RawListing> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
    const res = await fetchFn(treeUrl, { headers });
    if (!res.ok) throw new Error(`alirezarezvani tree fetch failed: HTTP ${res.status}`);
    const body = JSON.parse(await res.text()) as { tree?: TreeEntry[] };
    const tree = body.tree ?? [];
    const folders = extractSkillFolders(tree);
    for (const folder of folders) {
      const listing: Listing = {
        path: folder,
        sha: tree.find((t) => t.path === folder)?.sha ?? '',
        url: `https://github.com/alirezarezvani/claude-skills/tree/main/${folder}`,
      };
      yield {
        source: 'github-mirror',
        upstreamId: folder,
        upstreamUrl: listing.url,
        raw: listing,
      };
    }
  }

  return {
    id: 'github-mirror',
    label: 'alirezarezvani/claude-skills',
    fetchListings,
    normalize(raw): NormalizedListing {
      const l = raw.raw as Listing;
      const lastSegment = l.path.split('/').pop() ?? l.path;
      const id = `alirezarezvani/${slugify(lastSegment)}`;
      return {
        id,
        name: humanize(lastSegment),
        description: `Mirrored Claude skill from alirezarezvani/claude-skills (${l.path}).`,
        primaryFormat: 'claude-skill',
        formats: ['claude-skill'],
        toolCompatibility: ['claude-code', 'openai-codex', 'cursor', 'gemini-cli', 'aider'],
        category: 'mirrored',
        tags: ['claude-skill', 'mirror'],
        license: 'MIT',
        sourceType: 'github-mirror',
        sourceUrl: l.url,
        authorHandle: 'alirezarezvani',
        contentHash: sha256Hex(`alirezarezvani:${id}:${l.sha}`),
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

function humanize(input: string): string {
  return input.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
