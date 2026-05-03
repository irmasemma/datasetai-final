// PostHog wrapper. No-op when POSTHOG_KEY is absent — safe in tests and local dev.
// We deliberately avoid importing posthog-node at module load: it's lazily resolved when
// initialized so packages that never instantiate it don't pay the dep cost.

import type { EventName, EventProperties } from './events.js';

export interface PosthogConfig {
  readonly apiKey: string | undefined;
  readonly host?: string;
  readonly enabled?: boolean;
}

export interface PosthogClient {
  track(event: EventName, properties?: EventProperties, distinctId?: string): void;
  identify(distinctId: string, properties?: EventProperties): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

const NOOP: PosthogClient = {
  track: () => {},
  identify: () => {},
  flush: async () => {},
  shutdown: async () => {},
};

export function createPosthogClient(config: PosthogConfig): PosthogClient {
  if (!config.apiKey || config.enabled === false) return NOOP;
  let lazy: { capture: (e: { event: string; distinctId: string; properties?: EventProperties }) => void; identify: (e: { distinctId: string; properties?: EventProperties }) => void; flush: () => Promise<void>; shutdown: () => Promise<void> } | null = null;

  const ensure = async () => {
    if (lazy) return lazy;
    const mod = (await import('posthog-node').catch(() => null)) as
      | { PostHog: new (key: string, opts?: { host?: string }) => typeof lazy }
      | null;
    if (!mod) return null;
    lazy = new mod.PostHog(config.apiKey!, { host: config.host ?? 'https://app.posthog.com' });
    return lazy;
  };

  return {
    track: (event, properties, distinctId = 'anonymous') => {
      void ensure().then((c) => c?.capture({ event, distinctId, properties }));
    },
    identify: (distinctId, properties) => {
      void ensure().then((c) => c?.identify({ distinctId, properties }));
    },
    flush: async () => {
      const c = await ensure();
      await c?.flush();
    },
    shutdown: async () => {
      const c = await ensure();
      await c?.shutdown();
    },
  };
}
