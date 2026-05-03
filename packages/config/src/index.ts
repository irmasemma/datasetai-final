// @datasetai/config — env validation. Real zod schema lands when concrete env vars
// arrive (DB URL in E1.2a, OAuth secrets in E1.3, R2 keys in E1.4, etc.).

export type NodeEnvName = 'development' | 'production' | 'test';

export interface AppEnv {
  readonly NODE_ENV: NodeEnvName;
}

export function loadEnv(): AppEnv {
  const raw = process.env['NODE_ENV'] ?? 'development';
  const NODE_ENV: NodeEnvName =
    raw === 'production' || raw === 'test' ? raw : 'development';
  return { NODE_ENV };
}
