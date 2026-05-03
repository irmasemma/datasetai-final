// `datasetai list` (story E3.10) — reads the project ledger.

import { projectLedgerPath, readLedger, type InstallLedgerEntry, type LedgerDeps } from '../local-ledger.js';

export interface ListOptions {
  readonly cwd: string;
}

export interface ListDeps {
  readonly ledger: LedgerDeps;
}

export async function runList(
  options: ListOptions,
  deps: ListDeps,
): Promise<readonly InstallLedgerEntry[]> {
  const ledger = await readLedger(projectLedgerPath(options.cwd), deps.ledger);
  return ledger.entries;
}

export function formatListEntries(entries: readonly InstallLedgerEntry[]): string {
  if (entries.length === 0) return 'No agents installed in this project.';
  const rows = entries.map((e) =>
    `${e.agentId}@${e.version}  format=${e.format}  tool=${e.tool}  installed=${e.installedAt.slice(0, 10)}`,
  );
  return rows.join('\n');
}
