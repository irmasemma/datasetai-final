// Minimal ambient declarations so @datasetai/core can compile without depending on
// @types/node in every downstream consumer. Real consumers ship @types/node themselves
// (web/cli/worker); these declarations satisfy tsc when transitively typechecking.
//
// These declarations are merged with @types/node when present.

declare module 'node:crypto' {
  interface Hash {
    update(data: Uint8Array | string): Hash;
    digest(): Uint8Array;
  }
  export function createHash(algorithm: string): Hash;
  export function randomBytes(size: number): Uint8Array;
}

declare const Buffer: {
  from(input: string, encoding: string): Uint8Array & { toString(encoding: string): string };
  from(input: ArrayLike<number> | ArrayBufferLike): Uint8Array & { toString(encoding: string): string };
  byteLength(input: string, encoding?: string): number;
};

declare module 'node:fs' {
  export const promises: {
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    writeFile(path: string, data: Uint8Array | string, encoding?: string): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    access(path: string): Promise<void>;
  };
}

declare module 'node:path' {
  const path: {
    join(...segments: string[]): string;
    dirname(p: string): string;
  };
  export default path;
  export function join(...segments: string[]): string;
  export function dirname(p: string): string;
}

declare class TextEncoder {
  encode(input: string): Uint8Array;
}

declare class TextDecoder {
  constructor(encoding?: string);
  decode(input: Uint8Array): string;
}
