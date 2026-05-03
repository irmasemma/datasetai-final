// Filesystem dependency adapters. Lets us inject mocks in tests.

import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import type { AdapterDeps } from '@datasetai/format-adapters';
import type { LedgerDeps } from './local-ledger.js';
import type { DetectionDeps } from './tool-detection.js';

export const realAdapterDeps: AdapterDeps = {
  readFile: async (p: string) => {
    try {
      return new Uint8Array(await readFile(p));
    } catch {
      return null;
    }
  },
  writeFile: async (p: string, contents: Uint8Array) => {
    await writeFile(p, contents);
  },
  mkdir: async (p: string, options) => {
    await mkdir(p, options);
  },
};

export const realLedgerDeps: LedgerDeps = {
  readFile: async (p: string) => {
    try {
      return await readFile(p, 'utf-8');
    } catch {
      return null;
    }
  },
  writeFile: async (p: string, contents: string) => {
    await writeFile(p, contents);
  },
  mkdir: async (p: string, options) => {
    await mkdir(p, options);
  },
};

export function makeDetectionDeps(cwd: string, homeDir: string): DetectionDeps {
  return {
    cwd,
    homeDir,
    exists: async (p: string) => {
      try {
        await stat(p);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const realFsRm = async (p: string) => {
  try {
    await rm(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
};
