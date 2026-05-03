// MCP server format adapter (story E3.4, Architecture AD-2).
// MCP servers are launched by the host tool. Install merges a launch entry into the host's
// config (Claude Desktop, Cursor MCP, Codex, ...) without overwriting existing entries.

import type { FormatId, ToolId } from '@datasetai/core';
import path from 'node:path';
import type {
  AgentContent,
  AgentFile,
  FormatAdapter,
  InstallResult,
  ToolTarget,
} from './index.js';

export const MCP_SERVER_FORMAT: FormatId = 'mcp-server';

export interface McpServerSpec {
  readonly name: string;
  readonly command: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}

const MANIFEST_FILES = ['mcp.json', 'manifest.json', 'package.json'] as const;

function findManifest(files: readonly AgentFile[]): AgentFile | undefined {
  for (const name of MANIFEST_FILES) {
    const f = files.find((file) => path.posix.basename(file.path).toLowerCase() === name);
    if (f) return f;
  }
  return undefined;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

export function parseMcpSpec(content: AgentContent): McpServerSpec | null {
  const manifest = findManifest(content.files);
  if (!manifest) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(bytesToString(manifest.content)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const mcp =
    (parsed['mcp'] as Record<string, unknown> | undefined) ?? parsed;
  const name = typeof mcp['name'] === 'string' ? (mcp['name'] as string) : undefined;
  const command = typeof mcp['command'] === 'string' ? (mcp['command'] as string) : undefined;
  if (!name || !command) return null;
  return {
    name,
    command,
    args: Array.isArray(mcp['args'])
      ? (mcp['args'] as unknown[]).filter((a): a is string => typeof a === 'string')
      : undefined,
    env:
      mcp['env'] && typeof mcp['env'] === 'object'
        ? (mcp['env'] as Record<string, string>)
        : undefined,
  };
}

const TOOL_CONFIG_PATHS: Record<ToolId, string[] | null> = {
  'claude-code': ['.claude', 'mcp.json'],
  'claude-desktop': ['Library', 'Application Support', 'Claude', 'claude_desktop_config.json'],
  cursor: ['.cursor', 'mcp.json'],
  'codex-cli': ['.codex', 'mcp.json'],
  aider: ['.aider', 'mcp.json'],
  'gemini-cli': ['.gemini', 'mcp.json'],
  windsurf: ['.windsurf', 'mcp.json'],
};

export function configPathFor(tool: ToolId, target: ToolTarget): string {
  const segments = TOOL_CONFIG_PATHS[tool];
  if (!segments) {
    return path.join(target.projectRoot, '.mcp.json');
  }
  if (tool === 'claude-desktop') {
    return path.join(target.homeDir, ...segments);
  }
  return path.join(target.projectRoot, ...segments);
}

interface ConfigShape {
  readonly mcpServers?: Record<string, { command: string; args?: string[]; env?: Record<string, string> }>;
  readonly [key: string]: unknown;
}

export function mergeMcpConfig(
  existing: ConfigShape | null,
  spec: McpServerSpec,
): ConfigShape {
  const base: ConfigShape = existing ?? {};
  const servers = { ...(base.mcpServers ?? {}) };
  servers[spec.name] = {
    command: spec.command,
    ...(spec.args ? { args: [...spec.args] } : {}),
    ...(spec.env ? { env: { ...spec.env } } : {}),
  };
  return { ...base, mcpServers: servers };
}

export function createMcpServerAdapter(deps: {
  readFile: (filePath: string) => Promise<Uint8Array | null>;
  writeFile: (filePath: string, contents: Uint8Array) => Promise<void>;
  mkdir: (dir: string, options?: { recursive: boolean }) => Promise<void>;
}): FormatAdapter {
  return {
    id: MCP_SERVER_FORMAT,
    detect(files) {
      return findManifest(files) !== undefined;
    },
    validate(content) {
      const errors: string[] = [];
      const warnings: string[] = [];
      const spec = parseMcpSpec(content);
      if (!spec) {
        errors.push('Could not parse MCP server spec — manifest must include `name` and `command`');
      }
      return { valid: errors.length === 0, errors, warnings };
    },
    async install(content, target) {
      const spec = parseMcpSpec(content);
      if (!spec) {
        throw new Error('MCP server spec invalid — install aborted');
      }
      const configPath = configPathFor(target.tool, target);
      await deps.mkdir(path.dirname(configPath), { recursive: true });

      const existingBytes = await deps.readFile(configPath);
      let existing: ConfigShape | null = null;
      if (existingBytes) {
        try {
          existing = JSON.parse(bytesToString(existingBytes)) as ConfigShape;
        } catch {
          existing = null;
        }
      }
      const merged = mergeMcpConfig(existing, spec);
      const out = new TextEncoder().encode(`${JSON.stringify(merged, null, 2)}\n`);
      await deps.writeFile(configPath, out);

      const result: InstallResult = {
        tool: target.tool,
        writtenPaths: [configPath],
      };
      return result;
    },
    toolCompatibility(): readonly ToolId[] {
      return ['claude-desktop', 'claude-code', 'cursor', 'codex-cli'];
    },
  };
}
