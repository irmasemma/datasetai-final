// Tests for Story E3.10 — `datasetai list` command.
// Reads .datasetai/manifest.json from the project root and prints rows.

import { describe, expect, it, vi } from 'vitest';
import { runList, formatListEntries } from '../src/commands/list.js';
import {
  homeLedgerPath,
  projectLedgerPath,
  type InstallLedger,
  type InstallLedgerEntry,
} from '../src/local-ledger.js';

function ledgerJson(entries: InstallLedgerEntry[]): string {
  const ledger: InstallLedger = { version: 1, entries };
  return JSON.stringify(ledger);
}

describe('list command (Story E3.10)', () => {
  const cwd = '/proj';

  it('returns empty list when no ledger present', async () => {
    const readFile = vi.fn(async () => null);
    const writeFile = vi.fn();
    const mkdir = vi.fn();
    const entries = await runList({ cwd }, { ledger: { readFile, writeFile, mkdir } });
    expect(entries).toEqual([]);
    expect(readFile).toHaveBeenCalledWith(projectLedgerPath(cwd));
  });

  it('returns entries from .datasetai/manifest.json', async () => {
    const entry: InstallLedgerEntry = {
      agentId: 'voltagent/code-reviewer',
      version: '1.0.0',
      format: 'claude-skill',
      tool: 'claude-code',
      writtenPaths: ['/proj/.claude/skills/code-reviewer/SKILL.md'],
      installedAt: '2026-05-03T00:00:00.000Z',
      projectRoot: cwd,
    };
    const readFile = vi.fn(async () => ledgerJson([entry]));
    const entries = await runList(
      { cwd },
      { ledger: { readFile, writeFile: vi.fn(), mkdir: vi.fn() } },
    );
    expect(entries).toEqual([entry]);
  });

  it('formatListEntries prints id/version/format/tool/install date', () => {
    const entry: InstallLedgerEntry = {
      agentId: 'voltagent/code-reviewer',
      version: '1.0.0',
      format: 'claude-skill',
      tool: 'claude-code',
      writtenPaths: [],
      installedAt: '2026-05-03T00:00:00.000Z',
      projectRoot: '/proj',
    };
    const out = formatListEntries([entry]);
    expect(out).toContain('voltagent/code-reviewer');
    expect(out).toContain('1.0.0');
    expect(out).toContain('claude-skill');
    expect(out).toContain('claude-code');
    expect(out).toContain('2026-05-03');
  });

  it('formatListEntries returns empty-state message for empty input', () => {
    expect(formatListEntries([])).toMatch(/no agents installed/i);
  });

  it('homeLedgerPath points at ~/.datasetai/installs.json (E3.10 spec)', () => {
    const p = homeLedgerPath('/home/u');
    expect(p).toMatch(/\.datasetai[\\/]installs\.json$/);
  });
});
