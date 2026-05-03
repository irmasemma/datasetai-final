// Format auto-detection on publish (story E4.3).
// Heuristic: walk every registered adapter's detect() — but also fall back to filename hints
// for prompt/markdown-only uploads where neither SKILL.md nor mcp.json is present.

import type { FormatId } from '@datasetai/core';
import path from 'node:path';
import type { AgentFile, AdapterRegistry } from './index.js';

export interface DetectionResult {
  readonly formats: readonly FormatId[];
  readonly primary: FormatId;
  readonly hints: readonly string[];
}

export function autoDetectFormats(
  files: readonly AgentFile[],
  registry: AdapterRegistry,
): DetectionResult {
  const detected: FormatId[] = [];
  const hints: string[] = [];

  for (const adapter of registry.all) {
    if (adapter.detect(files)) {
      detected.push(adapter.id);
      hints.push(`detected ${adapter.id}`);
    }
  }

  if (detected.length === 0) {
    const lowered = files.map((f) => path.posix.basename(f.path).toLowerCase());
    if (lowered.includes('agents.md') || lowered.includes('agent.md')) {
      detected.push('agents-md');
      hints.push('detected agents-md from filename');
    } else if (lowered.includes('.cursorrules') || lowered.includes('cursorrules')) {
      detected.push('cursorrules');
      hints.push('detected cursorrules from filename');
    } else if (lowered.some((n) => n.endsWith('.md') || n.endsWith('.txt'))) {
      detected.push('system-prompt');
      hints.push('falling back to system-prompt for plain markdown/text');
    }
  }

  if (detected.length === 0) {
    return {
      formats: [],
      primary: 'system-prompt',
      hints: ['no format detected — manual override required'],
    };
  }

  const primary = detected[0]!;
  return { formats: detected, primary, hints };
}
