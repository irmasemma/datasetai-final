// CLI configuration. Resolved from env or defaults; injectable so tests can override.

export interface CliConfig {
  readonly cdnBaseUrl: string;
  readonly apiBaseUrl: string;
  readonly homeDir: string;
  readonly cwd: string;
  readonly telemetryEnabled: boolean;
}

export const CLI_VERSION = '0.0.0';

export function loadCliConfig(env: NodeJS.ProcessEnv = process.env): CliConfig {
  return {
    cdnBaseUrl: env['DATASETAI_CDN_URL'] ?? 'https://cdn.datasetai.xyz',
    apiBaseUrl: env['DATASETAI_API_URL'] ?? 'https://datasetai.xyz',
    homeDir: env['HOME'] ?? env['USERPROFILE'] ?? process.cwd(),
    cwd: process.cwd(),
    telemetryEnabled: env['DATASETAI_TELEMETRY'] !== '0',
  };
}
