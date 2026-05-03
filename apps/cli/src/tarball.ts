// Tarball extraction. Returns AgentFiles (path + content) without touching the filesystem,
// so the format adapter can decide where to write them.

import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import * as tar from 'tar';
import type { AgentContent, AgentFile } from '@datasetai/format-adapters';

export async function extractTarball(bytes: Uint8Array): Promise<AgentContent> {
  const files: AgentFile[] = [];
  const stream = Readable.from(Buffer.from(bytes)).pipe(createGunzip());

  await new Promise<void>((resolve, reject) => {
    const parser = new tar.Parser({});
    parser.on('entry', (entry) => {
      if (entry.type !== 'File') {
        entry.resume();
        return;
      }
      const chunks: Buffer[] = [];
      entry.on('data', (chunk: Buffer) => chunks.push(chunk));
      entry.on('end', () => {
        files.push({
          path: String(entry.path).replace(/^\.\//, ''),
          content: new Uint8Array(Buffer.concat(chunks)),
        });
      });
      entry.on('error', reject);
    });
    parser.on('end', () => resolve());
    parser.on('error', reject);
    stream.pipe(parser);
    stream.on('error', reject);
  });

  return { files };
}
