// Tool auto-detection for the CLI install hot path.
// Architecture AD-6. Walks markers in priority order; returns the first match.
// Filesystem checks are case-insensitive (Windows-friendly) by going through statable paths.

import path from 'node:path';
import type { ToolId } from '@datasetai/core';

export interface DetectionDeps {
  readonly exists: (p: string) => Promise<boolean>;
  readonly cwd: string;
  readonly homeDir: string;
}

export interface DetectionMarker {
  readonly tool: ToolId;
  readonly relativePath: string;
  readonly scope: 'project' | 'home';
}

export const DETECTION_MARKERS: readonly DetectionMarker[] = [
  { tool: 'claude-code', relativePath: '.claude', scope: 'project' },
  { tool: 'cursor', relativePath: '.cursor', scope: 'project' },
  { tool: 'cursor', relativePath: '.cursorrules', scope: 'project' },
  { tool: 'codex-cli', relativePath: 'codex', scope: 'project' },
  { tool: 'codex-cli', relativePath: 'AGENTS.md', scope: 'project' },
  { tool: 'codex-cli', relativePath: 'agents.md', scope: 'project' },
  { tool: 'aider', relativePath: '.aider.conf.yml', scope: 'project' },
  { tool: 'windsurf', relativePath: '.windsurf', scope: 'project' },
  { tool: 'gemini-cli', relativePath: '.gemini', scope: 'project' },
  { tool: 'claude-code', relativePath: path.join('.config', 'claude'), scope: 'home' },
  { tool: 'cursor', relativePath: path.join('.config', 'cursor'), scope: 'home' },
];

export async function detectTool(deps: DetectionDeps): Promise<ToolId | null> {
  for (const marker of DETECTION_MARKERS) {
    const base = marker.scope === 'project' ? deps.cwd : deps.homeDir;
    const fullPath = path.join(base, marker.relativePath);
    if (await deps.exists(fullPath)) return marker.tool;
  }
  return null;
}

export async function detectAllTools(deps: DetectionDeps): Promise<readonly ToolId[]> {
  const found = new Set<ToolId>();
  for (const marker of DETECTION_MARKERS) {
    const base = marker.scope === 'project' ? deps.cwd : deps.homeDir;
    const fullPath = path.join(base, marker.relativePath);
    if (await deps.exists(fullPath)) found.add(marker.tool);
  }
  return Array.from(found);
}

export function parseToolList(value: string | undefined): readonly ToolId[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase() as ToolId)
    .filter((s) => s.length > 0);
}
