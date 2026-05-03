// Axiom (or any structured-log sink) wrapper. No-op when env vars absent.
// Logs to console.error in dev so failures still surface during local runs.

export interface AxiomConfig {
  readonly token: string | undefined;
  readonly dataset?: string;
  readonly enabled?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly fields?: Record<string, unknown>;
  readonly error?: unknown;
  readonly timestamp?: string;
}

export interface AxiomClient {
  log(record: LogRecord): void;
  flush(): Promise<void>;
}

const NOOP: AxiomClient = {
  log: () => {},
  flush: async () => {},
};

export function createAxiomClient(
  config: AxiomConfig,
  sink: (records: readonly LogRecord[]) => Promise<void> | void = async () => {},
): AxiomClient {
  if (!config.token || config.enabled === false) return NOOP;
  const buffer: LogRecord[] = [];
  return {
    log: (record) => {
      buffer.push({ ...record, timestamp: record.timestamp ?? new Date().toISOString() });
      if (buffer.length >= 50) {
        const drained = buffer.splice(0, buffer.length);
        void sink(drained);
      }
    },
    flush: async () => {
      const drained = buffer.splice(0, buffer.length);
      await sink(drained);
    },
  };
}
