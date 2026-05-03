// `datasetai search <query>` — calls the public web API.

import type { FormatId, ToolId } from '@datasetai/core';

export interface SearchHit {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly primaryFormat: string;
  readonly installCount30d: number;
}

export interface SearchOptions {
  readonly query: string;
  readonly format?: FormatId;
  readonly tool?: ToolId;
  readonly limit?: number;
}

export interface SearchDeps {
  readonly fetch: typeof fetch;
  readonly apiBaseUrl: string;
}

export type SearchError =
  | { code: 'SEARCH_REQUEST_FAILED'; details: string }
  | { code: 'SEARCH_PARSE_ERROR'; details: string };

export async function runSearch(
  options: SearchOptions,
  deps: SearchDeps,
): Promise<{ ok: true; hits: readonly SearchHit[] } | { ok: false; error: SearchError }> {
  const url = new URL('/api/v1/search', deps.apiBaseUrl);
  url.searchParams.set('q', options.query);
  if (options.format) url.searchParams.set('format', options.format);
  if (options.tool) url.searchParams.set('tool', options.tool);
  if (options.limit) url.searchParams.set('limit', String(options.limit));

  let response: Response;
  try {
    response = await deps.fetch(url.toString());
  } catch (e) {
    return {
      ok: false,
      error: { code: 'SEARCH_REQUEST_FAILED', details: e instanceof Error ? e.message : String(e) },
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: { code: 'SEARCH_REQUEST_FAILED', details: `HTTP ${response.status}` },
    };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (e) {
    return {
      ok: false,
      error: { code: 'SEARCH_PARSE_ERROR', details: e instanceof Error ? e.message : String(e) },
    };
  }
  const hits = Array.isArray((body as { hits?: unknown }).hits)
    ? ((body as { hits: SearchHit[] }).hits as SearchHit[])
    : [];
  return { ok: true, hits };
}
