// @datasetai/api-client — typed REST client used by web (server-side) + CLI.
// Real endpoint methods land alongside the API routes (E1.5+ / E2.x / E3.x / E4.x).

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly userAgent?: string;
}

export class ApiClient {
  constructor(public readonly config: ApiClientConfig) {}

  url(path: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
