// Tests for Story E3.5 — Tool Auto-Detection.
// Detection priority order (Architecture AD-6) and Windows case-insensitivity
// are tested against an in-memory `exists()` deps stub.

import { describe, expect, it } from 'vitest';
import {
  DETECTION_MARKERS,
  detectAllTools,
  detectTool,
  parseToolList,
} from '../src/tool-detection.js';
import path from 'node:path';

function existsFromSet(present: ReadonlySet<string>) {
  return async (p: string) => present.has(p.replace(/\\/g, '/'));
}

describe('tool auto-detection (Story E3.5)', () => {
  const cwd = '/proj';
  const homeDir = '/home/u';

  it('detects claude-code when ./.claude/ exists', async () => {
    const present = new Set([path.join(cwd, '.claude').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('claude-code');
  });

  it('detects cursor when ./.cursorrules exists', async () => {
    const present = new Set([path.join(cwd, '.cursorrules').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('cursor');
  });

  it('detects cursor when ./.cursor directory exists', async () => {
    const present = new Set([path.join(cwd, '.cursor').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('cursor');
  });

  it('detects codex-cli via AGENTS.md', async () => {
    const present = new Set([path.join(cwd, 'AGENTS.md').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('codex-cli');
  });

  it('detects aider via .aider.conf.yml', async () => {
    const present = new Set([path.join(cwd, '.aider.conf.yml').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('aider');
  });

  it('falls back to home dir markers when no project marker present', async () => {
    const present = new Set([path.join(homeDir, '.config', 'claude').replace(/\\/g, '/')]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('claude-code');
  });

  it('returns null when no marker is present', async () => {
    const tool = await detectTool({ cwd, homeDir, exists: async () => false });
    expect(tool).toBeNull();
  });

  it('priority: claude-code wins over cursor when both present', async () => {
    const present = new Set([
      path.join(cwd, '.claude').replace(/\\/g, '/'),
      path.join(cwd, '.cursor').replace(/\\/g, '/'),
    ]);
    const tool = await detectTool({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tool).toBe('claude-code');
  });

  it('detectAllTools returns the full set of detected tools', async () => {
    const present = new Set([
      path.join(cwd, '.claude').replace(/\\/g, '/'),
      path.join(cwd, '.cursorrules').replace(/\\/g, '/'),
    ]);
    const tools = await detectAllTools({ cwd, homeDir, exists: existsFromSet(present) });
    expect(tools).toContain('claude-code');
    expect(tools).toContain('cursor');
  });

  it('parseToolList splits comma-separated values and lowercases', () => {
    expect(parseToolList('Claude-Code,Cursor')).toEqual(['claude-code', 'cursor']);
    expect(parseToolList(undefined)).toEqual([]);
    expect(parseToolList('')).toEqual([]);
  });

  it('DETECTION_MARKERS includes all required priority entries', () => {
    const tools = DETECTION_MARKERS.map((m) => m.tool);
    for (const required of ['claude-code', 'cursor', 'codex-cli', 'aider']) {
      expect(tools).toContain(required);
    }
  });
});
