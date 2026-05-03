// @datasetai/core — domain entities, types, Result<T, E>, observability hooks.
// Architecture: AD-15 (Result types in core; exceptions only at boundaries).

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/**
 * Format identifiers — the FormatAdapter contract from Architecture AD-2.
 * Phase 1 ships `claude-skill` + `mcp-server`; others arrive in Phase 2.
 */
export type FormatId =
  | 'claude-skill'
  | 'mcp-server'
  | 'agents-md'
  | 'cursorrules'
  | 'system-prompt';

/**
 * Tool identifiers — the targets the CLI installs into.
 * Auto-detection priority order is defined in Architecture AD-6.
 */
export type ToolId =
  | 'claude-code'
  | 'claude-desktop'
  | 'cursor'
  | 'codex-cli'
  | 'aider'
  | 'gemini-cli'
  | 'windsurf';

/**
 * Source identifiers — auto-mirror provenance.
 * See Architecture AD-3 (SourceAdapter plugin architecture).
 */
export type SourceId =
  | 'direct-publish'
  | 'github-mirror'
  | 'voltagent-mirror'
  | 'smithery-mirror'
  | 'skillsmp-mirror'
  | 'prompts-chat-mirror'
  | 'cursor-directory-mirror';

export interface AgentRef {
  readonly id: string;
  readonly version: string;
}

export const PROJECT_NAME = 'datasetai.xyz';

export const ALL_FORMATS: readonly FormatId[] = [
  'claude-skill',
  'mcp-server',
  'agents-md',
  'cursorrules',
  'system-prompt',
];

export const ALL_TOOLS: readonly ToolId[] = [
  'claude-code',
  'claude-desktop',
  'cursor',
  'codex-cli',
  'aider',
  'gemini-cli',
  'windsurf',
];

export function parseAgentSpec(spec: string): { id: string; version: string | null } {
  const at = spec.lastIndexOf('@');
  if (at <= 0) return { id: spec, version: null };
  return { id: spec.slice(0, at), version: spec.slice(at + 1) };
}

export * from './manifest.js';
export * from './manifest-signing.js';
export * from './observability/index.js';
export * from './auth.js';
export * from './storage.js';
export * from './queue.js';
