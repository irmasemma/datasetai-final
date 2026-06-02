// prompts.chat / f/awesome-chatgpt-prompts mirror (story E5.6).
// CSV format: act,prompt[,for_devs]. We treat each row as a system-prompt listing.
// MVP surfaces these as listings; install is flagged "format coming soon" upstream.

import { sha256Hex } from './hash.js';
import { defaultFetch, type FetchLike, type NormalizedListing, type RawListing, type SourceAdapter } from './types.js';

const DEFAULT_CSV =
  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv';

interface CsvRow {
  readonly act: string;
  readonly prompt: string;
}

export function parseCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let i = 0;
  let field = '';
  let inQuotes = false;
  let record: string[] = [];
  let isFirst = true;

  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    if (record.length === 0 && field === '') return;
    pushField();
    if (isFirst) {
      isFirst = false;
      record = [];
      return;
    }
    if (record.length >= 2) {
      rows.push({ act: record[0]!, prompt: record[1]! });
    }
    record = [];
  };

  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      pushRecord();
      i += 1;
      if (ch === '\r' && text[i] === '\n') i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || record.length > 0) pushRecord();
  return rows;
}

export interface PromptsChatAdapterOptions {
  readonly csvUrl?: string;
  readonly fetch?: FetchLike;
}

export function createPromptsChatAdapter(
  opts: PromptsChatAdapterOptions = {},
): SourceAdapter {
  const fetchFn = opts.fetch ?? defaultFetch();
  const csvUrl = opts.csvUrl ?? DEFAULT_CSV;

  async function* fetchListings(): AsyncIterable<RawListing> {
    const res = await fetchFn(csvUrl);
    if (!res.ok) throw new Error(`prompts.chat CSV fetch failed: HTTP ${res.status}`);
    const text = await res.text();
    for (const row of parseCsv(text)) {
      yield {
        source: 'prompts-chat-mirror',
        upstreamId: row.act,
        upstreamUrl: 'https://prompts.chat/',
        raw: row,
      };
    }
  }

  return {
    id: 'prompts-chat-mirror',
    label: 'prompts.chat',
    fetchListings,
    normalize(raw): NormalizedListing {
      const r = raw.raw as CsvRow;
      const id = `prompts-chat/${slugify(r.act)}`;
      const description = r.prompt.slice(0, 240).replace(/\s+/g, ' ').trim();
      return {
        id,
        name: r.act,
        description: description || `System prompt: ${r.act}`,
        longDescription: r.prompt,
        primaryFormat: 'system-prompt',
        formats: ['system-prompt'],
        toolCompatibility: ['claude-code', 'chatgpt', 'cursor', 'gemini-cli'],
        category: 'prompt',
        tags: ['prompt', 'mirror'],
        license: 'CC0-1.0',
        sourceType: 'prompts-chat-mirror',
        sourceUrl: 'https://prompts.chat/',
        contentHash: sha256Hex(`promptschat:${id}:${r.prompt.slice(0, 200)}`),
      };
    },
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'unnamed'
  );
}
