// Tests for Story E3.4 — mcp-server format adapter.
// Acceptance: writes server launch config to client config file (claude_desktop_config.json,
// Cursor MCP config, etc.), merges existing config, toolCompatibility() returns
// ['claude-desktop', 'claude-code', 'cursor', 'codex-cli'].

import { describe, expect, it, vi } from 'vitest';
import {
  createMcpServerAdapter,
  parseMcpSpec,
  mergeMcpConfig,
  configPathFor,
  type AgentContent,
  type AgentFile,
  type ToolTarget,
} from '@datasetai/format-adapters';

function file(path: string, content: string): AgentFile {
  return { path, content: new TextEncoder().encode(content) };
}

const MCP_PACKAGE_JSON = JSON.stringify({
  name: 'my-pkg',
  mcp: { name: 'my-mcp', command: 'node', args: ['server.js'], env: { K: 'v' } },
});

function makeAdapter(initialConfig: Record<string, unknown> | null = null) {
  const readFile = vi.fn(async () =>
    initialConfig === null ? null : new TextEncoder().encode(JSON.stringify(initialConfig)),
  );
  const writeFile = vi.fn().mockResolvedValue(undefined);
  const mkdir = vi.fn().mockResolvedValue(undefined);
  const adapter = createMcpServerAdapter({ readFile, writeFile, mkdir });
  return { adapter, readFile, writeFile, mkdir };
}

describe('mcp-server adapter (Story E3.4)', () => {
  it("id is 'mcp-server'", () => {
    expect(makeAdapter().adapter.id).toBe('mcp-server');
  });

  it('toolCompatibility() returns the spec tool set', () => {
    const compat = makeAdapter().adapter.toolCompatibility();
    expect(compat).toEqual(
      expect.arrayContaining(['claude-desktop', 'claude-code', 'cursor', 'codex-cli']),
    );
  });

  it('detect() returns true when an MCP-shaped manifest is present', () => {
    const { adapter } = makeAdapter();
    expect(adapter.detect([file('package.json', MCP_PACKAGE_JSON)])).toBe(true);
  });

  it('detect() returns false when no manifest is present', () => {
    const { adapter } = makeAdapter();
    expect(adapter.detect([file('README.md', '# only readme')])).toBe(false);
  });

  it('parseMcpSpec extracts name + command + args + env', () => {
    const content: AgentContent = { files: [file('package.json', MCP_PACKAGE_JSON)] };
    const spec = parseMcpSpec(content);
    expect(spec).not.toBeNull();
    expect(spec?.name).toBe('my-mcp');
    expect(spec?.command).toBe('node');
    expect(spec?.args).toEqual(['server.js']);
    expect(spec?.env).toEqual({ K: 'v' });
  });

  it('parseMcpSpec returns null when manifest is missing required fields', () => {
    const content: AgentContent = {
      files: [file('package.json', JSON.stringify({ name: 'x' }))],
    };
    expect(parseMcpSpec(content)).toBeNull();
  });

  it('mergeMcpConfig adds a new server without dropping existing entries', () => {
    const existing = {
      mcpServers: { 'other-server': { command: 'other-cmd', args: ['x'] } },
    };
    const merged = mergeMcpConfig(existing, {
      name: 'new-server',
      command: 'node',
      args: ['./s.js'],
    });
    expect(merged.mcpServers!['other-server']).toBeDefined();
    expect(merged.mcpServers!['new-server']).toBeDefined();
    expect(merged.mcpServers!['new-server']!.command).toBe('node');
  });

  it('configPathFor: cursor → .cursor/mcp.json under project root', () => {
    const target: ToolTarget = { tool: 'cursor', projectRoot: '/proj', homeDir: '/home/u' };
    expect(configPathFor('cursor', target)).toMatch(/\.cursor[\\/]mcp\.json$/);
  });

  it('configPathFor: claude-desktop → home dir', () => {
    const target: ToolTarget = {
      tool: 'claude-desktop',
      projectRoot: '/proj',
      homeDir: '/home/u',
    };
    const result = configPathFor('claude-desktop', target);
    expect(result.startsWith('/home/u') || result.includes('home')).toBe(true);
  });

  it('install() merges into existing config (does not overwrite other servers)', async () => {
    const { adapter, writeFile } = makeAdapter({
      mcpServers: { 'existing-server': { command: 'existing-cmd' } },
    });
    const target: ToolTarget = {
      tool: 'cursor',
      projectRoot: '/proj',
      homeDir: '/home/u',
    };
    const content: AgentContent = { files: [file('package.json', MCP_PACKAGE_JSON)] };
    const result = await adapter.install(content, target);

    expect(result.tool).toBe('cursor');
    expect(result.writtenPaths.length).toBeGreaterThan(0);
    expect(writeFile).toHaveBeenCalledTimes(1);
    const written = writeFile.mock.calls[0]?.[1] as Uint8Array;
    const parsed = JSON.parse(new TextDecoder().decode(written));
    expect(parsed.mcpServers['existing-server']).toBeDefined();
    expect(parsed.mcpServers['my-mcp']).toBeDefined();
    expect(parsed.mcpServers['my-mcp'].command).toBe('node');
  });

  it('install() throws when MCP spec is invalid', async () => {
    const { adapter } = makeAdapter();
    const content: AgentContent = {
      files: [file('package.json', JSON.stringify({ name: 'broken' }))],
    };
    const target: ToolTarget = { tool: 'cursor', projectRoot: '/proj', homeDir: '/home/u' };
    await expect(adapter.install(content, target)).rejects.toThrow();
  });
});
