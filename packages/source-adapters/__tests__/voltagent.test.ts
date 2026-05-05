// Tests for Story E5.3 — Mirror Source: VoltAgent / awesome-agent-skills.
// Real local HTTP server with a fixture README. Validates parser + normalize()
// pipeline end-to-end including section-header → category extraction and the
// URL/name → format heuristic.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  categoryFromHeading,
  createVoltAgentAdapter,
  parseVoltAgentReadme,
} from '@datasetai/source-adapters';
import {
  startFixtureServer,
  type LocalHttpServer,
} from '../../../tests/helpers/local-http.js';

const FIXTURE_README_PATH = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'voltagent',
  'README.md',
);

describe('VoltAgent source adapter (Story E5.3)', () => {
  let server: LocalHttpServer;
  let readme: string;

  beforeAll(async () => {
    readme = await fs.readFile(FIXTURE_README_PATH, 'utf8');
    server = await startFixtureServer({ '/README.md': readme });
  });

  afterAll(async () => {
    await server.close();
  });

  it('parseVoltAgentReadme picks every well-formed bullet entry from the fixture', () => {
    const entries = parseVoltAgentReadme(readme);
    expect(entries.length).toBeGreaterThanOrEqual(8);
    const names = entries.map((e) => e.name);
    expect(names).toContain('Code Reviewer');
    expect(names).toContain('Test Author');
    expect(names).toContain('Postgres MCP Server');
    expect(entries.every((e) => /^https?:\/\//.test(e.url))).toBe(true);
  });

  it('attaches the nearest heading as `category` (h2 + summary>h3)', () => {
    const entries = parseVoltAgentReadme(readme);
    const byName = new Map(entries.map((e) => [e.name, e] as const));

    // Plain ## headers
    expect(byName.get('Code Reviewer')?.category).toBe('Code Review');
    expect(byName.get('Test Author')?.category).toBe('Code Review');
    expect(byName.get('Refactor Helper')?.category).toBe('Productivity');
    expect(byName.get('SQL Explorer')?.category).toBe('Data');

    // <details><summary><h3> pattern from real upstream
    expect(byName.get('anthropics/docx')?.category).toBe('Official Claude Skills');
    expect(byName.get('anthropics/pptx')?.category).toBe('Official Claude Skills');

    // ## MCP Servers
    expect(byName.get('Postgres MCP Server')?.category).toBe('MCP Servers');
    expect(byName.get('Stripe MCP Server')?.category).toBe('MCP Servers');
  });

  it('categoryFromHeading slugifies headings consistently', () => {
    expect(categoryFromHeading('Code Review')).toBe('code-review');
    expect(categoryFromHeading('Official Claude Skills')).toBe('official-claude-skills');
    expect(categoryFromHeading('MCP Servers')).toBe('mcp-servers');
    expect(categoryFromHeading(undefined)).toBe('mirrored');
    expect(categoryFromHeading('')).toBe('mirrored');
  });

  it('normalize() detects mcp-server format from URL/name and assigns multi-tool compat', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const byName = new Map(
      items.map((i) => {
        const n = adapter.normalize(i);
        return [n.name, n] as const;
      }),
    );

    // Postgres MCP Server → mcp-server primaryFormat, cross-tool compat
    const pgmcp = byName.get('Postgres MCP Server');
    expect(pgmcp).toBeDefined();
    expect(pgmcp!.primaryFormat).toBe('mcp-server');
    expect(pgmcp!.formats).toEqual(['mcp-server']);
    expect(pgmcp!.toolCompatibility).toContain('claude-desktop');
    expect(pgmcp!.toolCompatibility).toContain('cursor');
    expect(pgmcp!.toolCompatibility).toContain('gemini-cli');
    expect(pgmcp!.category).toBe('mcp-servers');
    expect(pgmcp!.tags).toContain('mcp-servers');
  });

  it('normalize() defaults to claude-skill format for non-MCP entries', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    const byName = new Map(
      items.map((i) => {
        const n = adapter.normalize(i);
        return [n.name, n] as const;
      }),
    );

    const codeReviewer = byName.get('Code Reviewer');
    expect(codeReviewer).toBeDefined();
    expect(codeReviewer!.primaryFormat).toBe('claude-skill');
    expect(codeReviewer!.formats).toEqual(['claude-skill']);
    expect(codeReviewer!.toolCompatibility).toEqual(['claude-code']);
    expect(codeReviewer!.category).toBe('code-review');
    expect(codeReviewer!.tags).toContain('code-review');
  });

  it('fetchListings() yields RawListings with source="voltagent-mirror"', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items = [];
    for await (const item of adapter.fetchListings()) items.push(item);
    expect(items.length).toBeGreaterThanOrEqual(8);
    expect(items[0]!.source).toBe('voltagent-mirror');
    expect(items[0]!.upstreamUrl).toMatch(/^https:\/\/github\.com\/voltagent\//);
  });

  it('content hash is deterministic across re-runs (E5.3 dedup invariant)', async () => {
    const adapter1 = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const adapter2 = createVoltAgentAdapter({
      readmeUrl: `${server.url}/README.md`,
      fetch: globalThis.fetch as never,
    });
    const items1 = [];
    for await (const i of adapter1.fetchListings()) items1.push(i);
    const items2 = [];
    for await (const i of adapter2.fetchListings()) items2.push(i);
    expect(adapter1.normalize(items1[0]!).contentHash).toBe(
      adapter2.normalize(items2[0]!).contentHash,
    );
  });

  it('fetch failure surfaces a clear error message', async () => {
    const adapter = createVoltAgentAdapter({
      readmeUrl: `${server.url}/does-not-exist`,
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
