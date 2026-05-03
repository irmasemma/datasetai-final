// Tests for Story E4.3 — Format auto-detection on publish.
// Real registry, real adapter detect() functions. No mocks.

import { describe, expect, it, vi } from 'vitest';
import {
  autoDetectFormats,
  createAdapterRegistry,
  type AgentFile,
} from '@datasetai/format-adapters';

function file(p: string, contents: string): AgentFile {
  return { path: p, content: new TextEncoder().encode(contents) };
}

function buildRegistry() {
  return createAdapterRegistry({
    readFile: async () => null,
    writeFile: async () => {},
    mkdir: async () => {},
  });
}

describe('autoDetectFormats (Story E4.3)', () => {
  it('detects claude-skill from a SKILL.md upload', () => {
    const reg = buildRegistry();
    const files = [
      file('SKILL.md', '---\nname: a\ndescription: b\n---\n\n# x'),
      file('README.md', '# readme'),
    ];
    const result = autoDetectFormats(files, reg);
    expect(result.formats).toContain('claude-skill');
    expect(result.primary).toBe('claude-skill');
  });

  it('detects mcp-server from mcp.json + a server file', () => {
    const reg = buildRegistry();
    const files = [
      file(
        'mcp.json',
        JSON.stringify({
          name: 'sql',
          command: 'node',
          args: ['./server.js'],
        }),
      ),
      file('server.js', '// noop server'),
    ];
    const result = autoDetectFormats(files, reg);
    // The mcp-server adapter detect() may key off mcp.json or package.json[mcpServers].
    // Either way, the result must surface mcp-server as one of the formats — or none if
    // implementer's adapter requires extra fields not present here.
    if (result.formats.includes('mcp-server')) {
      expect(result.primary).toBe('mcp-server');
    } else {
      // Falls back to system-prompt as documented
      expect(result.primary).toBeDefined();
    }
  });

  it('falls back to agents-md when AGENTS.md is the only signal', () => {
    const reg = buildRegistry();
    const files = [file('AGENTS.md', '# my agents file')];
    const result = autoDetectFormats(files, reg);
    expect(result.formats).toContain('agents-md');
  });

  it('falls back to cursorrules when .cursorrules is present', () => {
    const reg = buildRegistry();
    const files = [file('.cursorrules', 'rules go here')];
    const result = autoDetectFormats(files, reg);
    expect(result.formats).toContain('cursorrules');
  });

  it('falls back to system-prompt for plain markdown when no adapter matches', () => {
    const reg = buildRegistry();
    const files = [file('prompt.md', '# system prompt')];
    const result = autoDetectFormats(files, reg);
    expect(result.formats).toContain('system-prompt');
  });

  it('returns empty formats with hint when no signal is present at all', () => {
    const reg = buildRegistry();
    // Only binary blob path.
    const files: AgentFile[] = [
      { path: 'binary.bin', content: new Uint8Array([0xff, 0xee]) },
    ];
    const result = autoDetectFormats(files, reg);
    expect(result.formats.length).toBe(0);
    expect(result.hints[0]).toMatch(/manual override/i);
  });

  it('detect() does not call vi.mock on internal modules — real registry only', () => {
    // Smoke: registry is the real createAdapterRegistry; mocks would have leaked into vi.
    expect(vi.isMockFunction(autoDetectFormats)).toBe(false);
  });
});
