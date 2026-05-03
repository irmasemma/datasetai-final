// Local install ledger. Architecture: spec calls for `~/.datasetai/installs.json` (E3.10)
// and per-project `.datasetai/manifest.json` (E3.2). We maintain both: per-project for
// project install tracking, global for `datasetai list`-across-projects in Phase 2.

import path from 'node:path';
import type { FormatId, ToolId } from '@datasetai/core';

export interface InstallLedgerEntry {
  readonly agentId: string;
  readonly version: string;
  readonly format: FormatId;
  readonly tool: ToolId;
  readonly writtenPaths: readonly string[];
  readonly installedAt: string;
  readonly projectRoot: string;
}

export interface InstallLedger {
  readonly version: 1;
  readonly entries: readonly InstallLedgerEntry[];
}

export interface LedgerDeps {
  readonly readFile: (p: string) => Promise<string | null>;
  readonly writeFile: (p: string, contents: string) => Promise<void>;
  readonly mkdir: (p: string, options?: { recursive: boolean }) => Promise<void>;
}

export function projectLedgerPath(projectRoot: string): string {
  return path.join(projectRoot, '.datasetai', 'manifest.json');
}

export function homeLedgerPath(homeDir: string): string {
  return path.join(homeDir, '.datasetai', 'installs.json');
}

export async function readLedger(filePath: string, deps: LedgerDeps): Promise<InstallLedger> {
  const raw = await deps.readFile(filePath);
  if (!raw) return { version: 1, entries: [] };
  try {
    const parsed = JSON.parse(raw) as InstallLedger;
    if (parsed && Array.isArray(parsed.entries)) return parsed;
  } catch {
    // fall through to fresh ledger
  }
  return { version: 1, entries: [] };
}

export async function writeLedger(
  filePath: string,
  ledger: InstallLedger,
  deps: LedgerDeps,
): Promise<void> {
  await deps.mkdir(path.dirname(filePath), { recursive: true });
  await deps.writeFile(filePath, `${JSON.stringify(ledger, null, 2)}\n`);
}

export function addLedgerEntry(
  ledger: InstallLedger,
  entry: InstallLedgerEntry,
): InstallLedger {
  const remaining = ledger.entries.filter(
    (e) => !(e.agentId === entry.agentId && e.tool === entry.tool && e.projectRoot === entry.projectRoot),
  );
  return { version: 1, entries: [...remaining, entry] };
}

export function removeLedgerEntry(
  ledger: InstallLedger,
  predicate: (entry: InstallLedgerEntry) => boolean,
): { ledger: InstallLedger; removed: readonly InstallLedgerEntry[] } {
  const removed = ledger.entries.filter(predicate);
  const kept = ledger.entries.filter((e) => !predicate(e));
  return { ledger: { version: 1, entries: kept }, removed };
}
