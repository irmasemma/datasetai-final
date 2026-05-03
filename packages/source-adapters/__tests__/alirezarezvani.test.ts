// Tests for Story E5.4 — Mirror Source: alirezarezvani/claude-skills.
// Real local HTTP server returning the GitHub tree JSON. Adapter parses, normalizes.
// No mocks of internal modules.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  createAlirezarezvaniAdapter,
  extractSkillFolders,
} from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

const FIXTURE_TREE_PATH = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'alirezarezvani',
  'tree.json',
);

describe('alirezarezvani source adapter (Story E5.4)', () => {
  let server: LocalHttpServer;
  let treeJson: string;

  beforeAll(async () => {
    treeJson = await fs.readFile(FIXTURE_TREE_PATH, 'utf8');
    server = await startFixtureServer({
      '/tree': { status: 200, body: treeJson, contentType: 'application/json' },
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it('extractSkillFolders returns the parent folder of every SKILL.md blob', () => {
    const tree = (JSON.parse(treeJson) as { tree: ReadonlyArray<{ path: string; type: string; sha: string }> }).tree;
    const folders = extractSkillFolders(tree);
    expect(folders).toContain('skills/code-explainer');
    expect(folders).toContain('skills/test-runner');
  });

  it('fetchListings() yields one RawListing per skill folder', async () => {
    const adapter = createAlirezarezvaniAdapter({
      treeUrl: `${server.url}/tree`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items.length).toBe(2);
    expect(items[0]!.source).toBe('github-mirror');
  });

  it('normalize() produces alirezarezvani-prefixed slugs with full attribution', async () => {
    const adapter = createAlirezarezvaniAdapter({
      treeUrl: `${server.url}/tree`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const normalized = items.map((i) => adapter.normalize(i));
    const ids = normalized.map((n) => n.id);
    expect(ids).toContain('alirezarezvani/code-explainer');
    expect(ids).toContain('alirezarezvani/test-runner');
    for (const n of normalized) {
      expect(n.authorHandle).toBe('alirezarezvani');
      expect(n.sourceUrl).toContain('alirezarezvani/claude-skills');
      expect(n.contentHash).toMatch(/^[0-9a-f]{64}$/);
      expect(n.primaryFormat).toBe('claude-skill');
    }
  });

  it('non-OK upstream surfaces an error with HTTP status', async () => {
    const adapter = createAlirezarezvaniAdapter({
      treeUrl: `${server.url}/missing`,
      fetch: globalThis.fetch as never,
    });
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of adapter.fetchListings()) {
        // unreachable
      }
    }).rejects.toThrow(/HTTP\s+404/);
  });
});
