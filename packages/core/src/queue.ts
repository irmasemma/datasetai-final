// In-process job queue. Round 2 ships an InMemoryQueue so the worker boots without Redis;
// BullMQ swap-in lands in Phase 2. The interface is intentionally minimal so handlers stay pure.

export interface Job<T> {
  readonly id: string;
  readonly name: string;
  readonly payload: T;
  readonly attempts: number;
}

export type JobHandler<T> = (job: Job<T>) => Promise<void>;

export interface JobQueue {
  enqueue<T>(name: string, payload: T): Promise<string>;
  process<T>(name: string, handler: JobHandler<T>): void;
  drain(): Promise<void>;
  size(): number;
}

interface QueuedJob {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
  attempts: number;
}

export interface InMemoryQueueOptions {
  readonly maxAttempts?: number;
  readonly onError?: (job: Job<unknown>, err: unknown) => void;
}

export function createInMemoryQueue(options: InMemoryQueueOptions = {}): JobQueue {
  const handlers = new Map<string, JobHandler<unknown>>();
  const pending: QueuedJob[] = [];
  const maxAttempts = options.maxAttempts ?? 3;
  let nextId = 1;
  let running: Promise<void> | null = null;

  const tick = async (): Promise<void> => {
    while (pending.length) {
      const job = pending.shift()!;
      const handler = handlers.get(job.name);
      if (!handler) continue;
      job.attempts += 1;
      try {
        await handler({
          id: job.id,
          name: job.name,
          payload: job.payload,
          attempts: job.attempts,
        });
      } catch (err) {
        options.onError?.(
          { id: job.id, name: job.name, payload: job.payload, attempts: job.attempts },
          err,
        );
        if (job.attempts < maxAttempts) {
          pending.push(job);
        }
      }
    }
  };

  return {
    async enqueue(name, payload) {
      const id = String(nextId++);
      pending.push({ id, name, payload, attempts: 0 });
      if (!running) {
        running = tick().finally(() => {
          running = null;
        });
      }
      return id;
    },
    process(name, handler) {
      handlers.set(name, handler as JobHandler<unknown>);
    },
    async drain() {
      if (running) await running;
      while (pending.length) {
        await tick();
      }
    },
    size() {
      return pending.length;
    },
  };
}
