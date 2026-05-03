// datasetai CLI — command router.
// Architecture §2.3 + §5.3. Stories E3.1, E3.2, E3.6, E3.7, E3.8, E3.9, E3.10, E3.11.

import { Command } from 'commander';
import { PROJECT_NAME, parseAgentSpec, type FormatId, type ToolId } from '@datasetai/core';
import { CLI_VERSION, loadCliConfig, type CliConfig } from './config.js';
import { explainInstallError, runInstall } from './commands/install.js';
import { runSearch } from './commands/search.js';
import { formatListEntries, runList } from './commands/list.js';
import { realRemove, runUninstall } from './commands/uninstall.js';
import {
  realAdapterDeps,
  realLedgerDeps,
  makeDetectionDeps,
} from './fs-deps.js';
import { parseToolList } from './tool-detection.js';
import { loadVerificationKeys } from './verification-keys.js';

export function buildProgram(config: CliConfig = loadCliConfig()): Command {
  const program = new Command();
  program
    .name('datasetai')
    .description('npm for AI agents — install Claude Skills, MCP servers, and more')
    .version(`${CLI_VERSION} (${PROJECT_NAME})`);

  program
    .command('install')
    .description('Install an agent into the current project')
    .argument('<agent>', 'agent id, optionally with @version')
    .option('--tool <tool>', 'override tool detection (e.g. claude-code)')
    .option('--tools <tools>', 'install into multiple tools (comma-separated)')
    .option('--format <format>', 'override the manifest format')
    .option('--version <version>', 'pin to a specific version (overrides @version in arg)')
    .action(
      async (
        agentArg: string,
        opts: { tool?: string; tools?: string; format?: string; version?: string },
      ) => {
        const tools = opts.tools
          ? parseToolList(opts.tools)
          : opts.tool
            ? parseToolList(opts.tool)
            : [];
        const result = await runInstall(
          {
            spec: agentArg,
            tools,
            format: opts.format as FormatId | undefined,
            version: opts.version,
          },
          {
            fetch,
            cdnBaseUrl: config.cdnBaseUrl,
            verificationKeys: loadVerificationKeys(),
            cwd: config.cwd,
            homeDir: config.homeDir,
            adapter: realAdapterDeps,
            ledger: realLedgerDeps,
            detect: makeDetectionDeps(config.cwd, config.homeDir),
          },
        );
        if (!result.ok) {
          console.error(`error: ${explainInstallError(result.error)}`);
          process.exitCode = 1;
          return;
        }
        const succeeded = result.summary.results.filter((r) => r.success);
        const failed = result.summary.results.filter((r) => !r.success);
        console.log(
          `Installed ${result.summary.agentId}@${result.summary.version} into ${succeeded.length}/${result.summary.results.length} tool(s).`,
        );
        for (const f of failed) {
          console.error(`  ! ${f.tool}: ${f.error}`);
        }
        if (failed.length > 0 && succeeded.length === 0) process.exitCode = 1;
      },
    );

  program
    .command('search')
    .description('Search the catalog')
    .argument('<query>', 'search query')
    .option('--format <format>', 'filter by format')
    .option('--tool <tool>', 'filter by tool')
    .option('--limit <n>', 'max results', (v) => Number.parseInt(v, 10), 10)
    .action(async (query: string, opts: { format?: string; tool?: string; limit?: number }) => {
      const result = await runSearch(
        {
          query,
          format: opts.format as FormatId | undefined,
          tool: opts.tool as ToolId | undefined,
          limit: opts.limit,
        },
        { fetch, apiBaseUrl: config.apiBaseUrl },
      );
      if (!result.ok) {
        console.error(
          `error: ${result.error.code} — ${'details' in result.error ? result.error.details : ''}`,
        );
        process.exitCode = 1;
        return;
      }
      if (result.hits.length === 0) {
        console.log(`No results for "${query}".`);
        return;
      }
      for (const hit of result.hits) {
        console.log(
          `${hit.id}  [${hit.primaryFormat}]  ${hit.installCount30d.toLocaleString()} installs/30d`,
        );
        console.log(`  ${hit.description}`);
      }
    });

  program
    .command('list')
    .description('List agents installed in the current project')
    .action(async () => {
      const entries = await runList({ cwd: config.cwd }, { ledger: realLedgerDeps });
      console.log(formatListEntries(entries));
    });

  program
    .command('uninstall')
    .description('Remove an installed agent from the current project')
    .argument('<agent>', 'agent id (without @version)')
    .option('--tool <tool>', 'only uninstall this tool variant')
    .action(async (agentArg: string, opts: { tool?: string }) => {
      const parsed = parseAgentSpec(agentArg);
      const result = await runUninstall(
        { agentId: parsed.id, tool: opts.tool as ToolId | undefined, cwd: config.cwd },
        { ledger: realLedgerDeps, remove: realRemove },
      );
      if (result.removed.length === 0) {
        console.log(`No matching install of ${parsed.id} found.`);
        return;
      }
      console.log(`Removed ${result.removed.length} install record(s).`);
      if (result.missingFiles.length > 0) {
        console.warn(`Note: ${result.missingFiles.length} file(s) were already gone.`);
      }
    });

  return program;
}

export async function run(args: readonly string[]): Promise<number> {
  const program = buildProgram();
  process.exitCode = 0;
  try {
    await program.parseAsync(['node', 'datasetai', ...args]);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
  return process.exitCode ?? 0;
}
