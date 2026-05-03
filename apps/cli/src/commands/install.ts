// `datasetai install <agent>[@version]` (story E3.2 + E3.6 overrides + E3.7 multi-tool + E3.8 pin).

import type { FormatId, ToolId, VerificationKey } from '@datasetai/core';
import { parseAgentSpec } from '@datasetai/core';
import {
  createAdapterRegistry,
  type AdapterDeps,
  type AdapterRegistry,
} from '@datasetai/format-adapters';
import {
  fetchManifest,
  fetchContent,
  type FetchContentError,
  type FetchManifestError,
} from '../manifest-fetch.js';
import { extractTarball } from '../tarball.js';
import {
  addLedgerEntry,
  projectLedgerPath,
  readLedger,
  writeLedger,
  type InstallLedgerEntry,
  type LedgerDeps,
} from '../local-ledger.js';
import { detectTool, type DetectionDeps } from '../tool-detection.js';

export interface InstallOptions {
  readonly spec: string;
  readonly tools?: readonly ToolId[];
  readonly format?: FormatId;
  readonly version?: string;
}

export interface InstallDeps {
  readonly fetch: typeof fetch;
  readonly cdnBaseUrl: string;
  readonly verificationKeys: readonly VerificationKey[];
  readonly cwd: string;
  readonly homeDir: string;
  readonly adapter: AdapterDeps;
  readonly ledger: LedgerDeps;
  readonly detect: DetectionDeps;
  readonly logger?: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };
  readonly registry?: AdapterRegistry;
}

export interface InstallToolResult {
  readonly tool: ToolId;
  readonly success: boolean;
  readonly writtenPaths: readonly string[];
  readonly error?: string;
}

export interface InstallResultSummary {
  readonly agentId: string;
  readonly version: string;
  readonly format: FormatId;
  readonly results: readonly InstallToolResult[];
}

export type InstallError =
  | { code: 'NO_TOOL_DETECTED' }
  | { code: 'FORMAT_NOT_SUPPORTED'; format: FormatId }
  | { code: 'FORMAT_TOOL_INCOMPATIBLE'; format: FormatId; tool: ToolId }
  | FetchManifestError
  | FetchContentError;

export async function runInstall(
  options: InstallOptions,
  deps: InstallDeps,
): Promise<{ ok: true; summary: InstallResultSummary } | { ok: false; error: InstallError }> {
  const log = deps.logger ?? consoleLogger();
  const parsed = parseAgentSpec(options.spec);
  const requestedVersion = options.version ?? parsed.version ?? 'latest';

  log.info(`Resolving ${parsed.id}@${requestedVersion}…`);
  const manifestResult = await fetchManifest(
    {
      fetch: deps.fetch,
      cdnBaseUrl: deps.cdnBaseUrl,
      verificationKeys: deps.verificationKeys,
    },
    parsed.id,
    requestedVersion,
  );
  if (!manifestResult.ok) return { ok: false, error: manifestResult.error };
  const manifest = manifestResult.manifest;

  log.info(`Verified manifest signature (key ${manifest.keyId}).`);

  const contentResult = await fetchContent({ fetch: deps.fetch }, manifest);
  if (!contentResult.ok) return { ok: false, error: contentResult.error };

  const content = await extractTarball(contentResult.bytes);

  const registry = deps.registry ?? createAdapterRegistry(deps.adapter);
  const formatId: FormatId = options.format ?? manifest.format;
  const adapter = registry.byId(formatId);
  if (!adapter) {
    return { ok: false, error: { code: 'FORMAT_NOT_SUPPORTED', format: formatId } };
  }

  let targetTools: readonly ToolId[];
  if (options.tools && options.tools.length > 0) {
    targetTools = options.tools;
  } else {
    const detected = await detectTool(deps.detect);
    if (!detected) return { ok: false, error: { code: 'NO_TOOL_DETECTED' } };
    targetTools = [detected];
  }

  const compatible = new Set(adapter.toolCompatibility());
  const results: InstallToolResult[] = [];

  for (const tool of targetTools) {
    if (!compatible.has(tool)) {
      results.push({
        tool,
        success: false,
        writtenPaths: [],
        error: `Format ${formatId} is not compatible with tool ${tool}`,
      });
      continue;
    }
    try {
      const result = await adapter.install(content, {
        tool,
        projectRoot: deps.cwd,
        homeDir: deps.homeDir,
      });
      results.push({ tool, success: true, writtenPaths: result.writtenPaths });
      log.info(`Installed into ${tool} (${result.writtenPaths.length} files).`);

      const ledgerPath = projectLedgerPath(deps.cwd);
      const ledger = await readLedger(ledgerPath, deps.ledger);
      const entry: InstallLedgerEntry = {
        agentId: parsed.id,
        version: manifest.version,
        format: formatId,
        tool,
        writtenPaths: result.writtenPaths,
        installedAt: new Date().toISOString(),
        projectRoot: deps.cwd,
      };
      await writeLedger(ledgerPath, addLedgerEntry(ledger, entry), deps.ledger);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ tool, success: false, writtenPaths: [], error: message });
      log.error(`Failed installing into ${tool}: ${message}`);
    }
  }

  return {
    ok: true,
    summary: {
      agentId: parsed.id,
      version: manifest.version,
      format: formatId,
      results,
    },
  };
}

function consoleLogger() {
  return {
    info: (m: string) => console.log(m),
    warn: (m: string) => console.warn(m),
    error: (m: string) => console.error(m),
  };
}

export function explainInstallError(error: InstallError): string {
  switch (error.code) {
    case 'MANIFEST_NOT_FOUND':
      return `Agent ${error.agentId}@${error.version} not found.`;
    case 'MANIFEST_PARSE_ERROR':
      return `Could not parse manifest: ${error.details}`;
    case 'MANIFEST_SIGNATURE_MISSING':
      return 'Manifest signature missing — cannot verify authenticity.';
    case 'MANIFEST_KEY_UNKNOWN':
      return `Manifest signed with unknown key ${error.keyId}. Update the CLI to the latest version.`;
    case 'MANIFEST_SIGNATURE_INVALID':
      return `Manifest signature invalid for key ${error.keyId}. Refusing to install.`;
    case 'CONTENT_NOT_FOUND':
      return `Content tarball not found at ${error.url}.`;
    case 'CONTENT_FETCH_ERROR':
      return `Could not download content: ${error.details}`;
    case 'CONTENT_HASH_MISMATCH':
      return `Content hash mismatch (expected ${error.expected}, got ${error.actual}).`;
    case 'NO_TOOL_DETECTED':
      return 'No AI tool detected. Pass --tool=<tool> explicitly.';
    case 'FORMAT_NOT_SUPPORTED':
      return `Format ${error.format} is not supported by this CLI build.`;
    case 'FORMAT_TOOL_INCOMPATIBLE':
      return `Format ${error.format} cannot be installed into ${error.tool}.`;
    default:
      return JSON.stringify(error);
  }
}
