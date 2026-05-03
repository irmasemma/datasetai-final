// `datasetai uninstall <agent>` (story E3.11).

import { rm } from 'node:fs/promises';
import type { ToolId } from '@datasetai/core';
import {
  projectLedgerPath,
  readLedger,
  removeLedgerEntry,
  writeLedger,
  type InstallLedgerEntry,
  type LedgerDeps,
} from '../local-ledger.js';

export interface UninstallOptions {
  readonly agentId: string;
  readonly tool?: ToolId;
  readonly cwd: string;
}

export interface UninstallDeps {
  readonly ledger: LedgerDeps;
  readonly remove: (path: string) => Promise<void>;
}

export interface UninstallResult {
  readonly removed: readonly InstallLedgerEntry[];
  readonly missingFiles: readonly string[];
}

export async function runUninstall(
  options: UninstallOptions,
  deps: UninstallDeps,
): Promise<UninstallResult> {
  const ledgerPath = projectLedgerPath(options.cwd);
  const ledger = await readLedger(ledgerPath, deps.ledger);
  const { ledger: nextLedger, removed } = removeLedgerEntry(ledger, (entry) => {
    if (entry.agentId !== options.agentId) return false;
    if (options.tool && entry.tool !== options.tool) return false;
    return true;
  });

  const missing: string[] = [];
  for (const entry of removed) {
    for (const filePath of entry.writtenPaths) {
      try {
        await deps.remove(filePath);
      } catch {
        missing.push(filePath);
      }
    }
  }

  await writeLedger(ledgerPath, nextLedger, deps.ledger);
  return { removed, missingFiles: missing };
}

export const realRemove = async (path: string): Promise<void> => {
  await rm(path, { force: true, recursive: true });
};
