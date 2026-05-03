// Tests for Story E3.11 — `datasetai uninstall` command.

import { describe, expect, it, vi } from 'vitest';
import { runUninstall } from '../src/commands/uninstall.js';
import {
  type InstallLedger,
  type InstallLedgerEntry,
  projectLedgerPath,
} from '../src/local-ledger.js';

const cwd = '/proj';

function ledgerWith(entries: InstallLedgerEntry[]): string {
  const ledger: InstallLedger = { version: 1, entries };
  return JSON.stringify(ledger);
}

const claudeEntry: InstallLedgerEntry = {
  agentId: 'voltagent/code-reviewer',
  version: '1.0.0',
  format: 'claude-skill',
  tool: 'claude-code',
  writtenPaths: ['/proj/.claude/skills/code-reviewer/SKILL.md'],
  installedAt: '2026-05-01T00:00:00.000Z',
  projectRoot: cwd,
};

const cursorEntry: InstallLedgerEntry = {
  agentId: 'voltagent/code-reviewer',
  version: '1.0.0',
  format: 'mcp-server',
  tool: 'cursor',
  writtenPaths: ['/proj/.cursor/mcp.json'],
  installedAt: '2026-05-01T00:00:00.000Z',
  projectRoot: cwd,
};

describe('uninstall command (Story E3.11)', () => {
  it('removes files written by install + clears ledger entry', async () => {
    const written = new Map<string, string>();
    written.set(projectLedgerPath(cwd), ledgerWith([claudeEntry]));

    const readFile = vi.fn(async (p: string) => written.get(p) ?? null);
    const writeFile = vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    });
    const mkdir = vi.fn().mockResolvedValue(undefined);
    const remove = vi.fn().mockResolvedValue(undefined);

    const result = await runUninstall(
      { agentId: 'voltagent/code-reviewer', cwd },
      { ledger: { readFile, writeFile, mkdir }, remove },
    );

    expect(result.removed).toHaveLength(1);
    expect(result.missingFiles).toEqual([]);
    expect(remove).toHaveBeenCalledWith(claudeEntry.writtenPaths[0]);
    const finalLedger = JSON.parse(written.get(projectLedgerPath(cwd)) ?? '{}');
    expect(finalLedger.entries).toEqual([]);
  });

  it('--tool=cursor only removes Cursor variant, preserves Claude Code variant', async () => {
    const written = new Map<string, string>();
    written.set(projectLedgerPath(cwd), ledgerWith([claudeEntry, cursorEntry]));

    const readFile = vi.fn(async (p: string) => written.get(p) ?? null);
    const writeFile = vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    });
    const remove = vi.fn().mockResolvedValue(undefined);

    const result = await runUninstall(
      { agentId: 'voltagent/code-reviewer', tool: 'cursor', cwd },
      { ledger: { readFile, writeFile, mkdir: vi.fn() }, remove },
    );

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]?.tool).toBe('cursor');
    const finalLedger = JSON.parse(written.get(projectLedgerPath(cwd)) ?? '{}');
    expect(finalLedger.entries).toHaveLength(1);
    expect(finalLedger.entries[0].tool).toBe('claude-code');
    // Only the cursor mcp.json was removed.
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(cursorEntry.writtenPaths[0]);
  });

  it('files already-removed-manually → tracks missingFiles, exits ok', async () => {
    const written = new Map<string, string>();
    written.set(projectLedgerPath(cwd), ledgerWith([claudeEntry]));

    const readFile = vi.fn(async (p: string) => written.get(p) ?? null);
    const writeFile = vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    });
    const remove = vi.fn().mockRejectedValue(new Error('ENOENT'));

    const result = await runUninstall(
      { agentId: 'voltagent/code-reviewer', cwd },
      { ledger: { readFile, writeFile, mkdir: vi.fn() }, remove },
    );

    expect(result.removed).toHaveLength(1);
    expect(result.missingFiles.length).toBeGreaterThan(0);
  });

  it('uninstalling unknown agent → no removal, ledger untouched', async () => {
    const written = new Map<string, string>();
    written.set(projectLedgerPath(cwd), ledgerWith([claudeEntry]));

    const readFile = vi.fn(async (p: string) => written.get(p) ?? null);
    const writeFile = vi.fn(async (p: string, c: string) => {
      written.set(p, c);
    });
    const remove = vi.fn();

    const result = await runUninstall(
      { agentId: 'no/such-agent', cwd },
      { ledger: { readFile, writeFile, mkdir: vi.fn() }, remove },
    );

    expect(result.removed).toEqual([]);
    expect(remove).not.toHaveBeenCalled();
  });
});
