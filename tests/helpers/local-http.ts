// Local HTTP fixture server for source-adapter / mirror tests.
// Binds to 127.0.0.1 on an ephemeral port and serves canned bytes per route.
// Real network — tests must use this URL with their adapters' real fetch path.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface LocalHttpServer {
  readonly url: string;
  readonly close: () => Promise<void>;
}

export type RouteBody =
  | string
  | Buffer
  | Uint8Array
  | { status: number; body: string | Buffer | Uint8Array; contentType?: string };

function normalizeRoute(route: RouteBody): {
  status: number;
  body: Buffer;
  contentType: string;
} {
  if (typeof route === 'string') {
    return {
      status: 200,
      body: Buffer.from(route, 'utf8'),
      contentType: route.trimStart().startsWith('{') || route.trimStart().startsWith('[')
        ? 'application/json'
        : 'text/plain; charset=utf-8',
    };
  }
  if (route instanceof Uint8Array || Buffer.isBuffer(route)) {
    return {
      status: 200,
      body: Buffer.isBuffer(route) ? route : Buffer.from(route),
      contentType: 'application/octet-stream',
    };
  }
  const body =
    typeof route.body === 'string'
      ? Buffer.from(route.body, 'utf8')
      : Buffer.isBuffer(route.body)
        ? route.body
        : Buffer.from(route.body);
  return {
    status: route.status,
    body,
    contentType: route.contentType ?? 'application/octet-stream',
  };
}

/**
 * Start a local HTTP server that serves the given route map.
 * Keys are URL paths (with leading '/'). Method is ignored — same response for any verb.
 * Unmatched paths return 404.
 */
export async function startFixtureServer(
  routes: Record<string, RouteBody>,
): Promise<LocalHttpServer> {
  const normalized = new Map<string, ReturnType<typeof normalizeRoute>>();
  for (const [k, v] of Object.entries(routes)) {
    normalized.set(k, normalizeRoute(v));
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/';
    const route = normalized.get(path);
    if (!route) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`not found: ${path}`);
      return;
    }
    res.statusCode = route.status;
    res.setHeader('Content-Type', route.contentType);
    res.end(route.body);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${addr.port}`;

  return {
    url,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}
