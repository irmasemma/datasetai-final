// SourceAdapter contract (story E5.2). Each mirror source emits a stream of RawListings;
// `normalize` returns a row-ready NormalizedListing the worker can upsert into `agents`.
// Tests pass a fixture-server fetch function via the constructor.

import type { FormatId, SourceId } from '@datasetai/core';

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export interface RawListing {
  readonly source: SourceId;
  readonly upstreamId: string;
  readonly upstreamUrl: string;
  readonly raw: unknown;
}

export interface NormalizedListing {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly longDescription?: string;
  readonly primaryFormat: FormatId;
  readonly formats: readonly FormatId[];
  readonly toolCompatibility: readonly string[];
  readonly category?: string;
  readonly tags: readonly string[];
  readonly license: string;
  readonly sourceType: SourceId;
  readonly sourceUrl: string;
  readonly authorHandle?: string;
  readonly contentHash: string;
}

export interface SourceAdapter {
  readonly id: SourceId;
  readonly label: string;
  fetchListings(): AsyncIterable<RawListing>;
  normalize(raw: RawListing): NormalizedListing;
}

export function defaultFetch(): FetchLike {
  return globalThis.fetch as unknown as FetchLike;
}
