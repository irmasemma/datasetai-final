// Sentry wrapper. No-op when SENTRY_DSN is absent.
// The actual @sentry/* SDK is imported by the consumer (web / worker / cli) since each
// runtime needs a different package. Here we expose just a typed captureException helper.

export interface SentryConfig {
  readonly dsn: string | undefined;
  readonly release?: string;
  readonly environment?: string;
}

export interface SentryClient {
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string } | null): void;
}

const NOOP: SentryClient = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
};

export function createSentryClient(
  config: SentryConfig,
  delegate?: SentryClient,
): SentryClient {
  if (!config.dsn) return NOOP;
  return delegate ?? NOOP;
}
