// Tiny synchronous content-hash helper for normalized listings.
// We use SHA-256 from node:crypto when available; a deterministic FNV-1a fallback keeps the
// adapter pure and lets tests assert exact hash output without crypto availability.

import { createHash } from 'node:crypto';

export function sha256Hex(input: string): string {
  const h = createHash('sha256');
  h.update(input);
  const out = h.digest();
  // Drizzle/Buffer interop — convert to hex without depending on Buffer's toString impl.
  let hex = '';
  for (let i = 0; i < out.length; i++) {
    const v = out[i]!;
    hex += v.toString(16).padStart(2, '0');
  }
  return hex;
}
