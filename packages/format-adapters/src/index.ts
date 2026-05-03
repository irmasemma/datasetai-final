// @datasetai/format-adapters — FormatAdapter contract + implementations.
// Architecture: AD-2. Phase-1 ships claude-skill (E3.3) + mcp-server (E3.4).

import type { FormatId, ToolId } from '@datasetai/core';

export interface AgentFile {
  readonly path: string;
  readonly content: Uint8Array;
}

export interface AgentContent {
  readonly files: readonly AgentFile[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface InstallResult {
  readonly tool: ToolId;
  readonly writtenPaths: readonly string[];
}

export interface ToolTarget {
  readonly tool: ToolId;
  readonly projectRoot: string;
  readonly homeDir: string;
}

export interface FormatAdapter {
  readonly id: FormatId;
  detect(files: readonly AgentFile[]): boolean;
  validate(content: AgentContent): ValidationResult;
  install(content: AgentContent, target: ToolTarget): Promise<InstallResult>;
  toolCompatibility(): readonly ToolId[];
  exportFor?(content: AgentContent, tool: ToolId): AgentContent;
}

export interface AdapterDeps {
  readonly readFile: (filePath: string) => Promise<Uint8Array | null>;
  readonly writeFile: (filePath: string, contents: Uint8Array) => Promise<void>;
  readonly mkdir: (dir: string, options?: { recursive: boolean }) => Promise<void>;
}

export interface AdapterRegistry {
  readonly all: readonly FormatAdapter[];
  byId(id: FormatId): FormatAdapter | undefined;
  detect(files: readonly AgentFile[]): FormatAdapter | undefined;
}

export { createClaudeSkillAdapter, CLAUDE_SKILL_FORMAT } from './claude-skill.js';
export {
  createMcpServerAdapter,
  parseMcpSpec,
  mergeMcpConfig,
  configPathFor,
  MCP_SERVER_FORMAT,
} from './mcp-server.js';
export { autoDetectFormats, type DetectionResult } from './auto-detect.js';
export {
  lintPublish,
  ALLOWED_LICENSES,
  isMirrorAllowedLicense,
  type LintReport,
  type LintMessage,
  type LintInput,
  type AllowedLicense,
} from './linter.js';

import { createClaudeSkillAdapter } from './claude-skill.js';
import { createMcpServerAdapter } from './mcp-server.js';

export function createAdapterRegistry(deps: AdapterDeps): AdapterRegistry {
  const all: readonly FormatAdapter[] = [
    createClaudeSkillAdapter({
      writeFile: deps.writeFile,
      mkdir: deps.mkdir,
    }),
    createMcpServerAdapter(deps),
  ];
  return {
    all,
    byId: (id) => all.find((a) => a.id === id),
    detect: (files) => all.find((a) => a.detect(files)),
  };
}

// Legacy registry kept for backwards-compat with code that imported `adapters` directly.
// Tests should use createAdapterRegistry instead so they can inject FS dependencies.
export const adapters: readonly FormatAdapter[] = [];

export function findAdapterById(id: FormatId): FormatAdapter | undefined {
  return adapters.find((a) => a.id === id);
}
