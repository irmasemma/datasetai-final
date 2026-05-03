// Tests for Story E5.1 — InMemoryQueue (BullMQ swap-in lands Phase 2).
// Real queue, real handlers, real DB-shaped assertions when callers wire them.
// We use a worker-local @datasetai/core import; no mocks.

import { describe, expect, it } from 'vitest';
import { createInMemoryQueue, type Job } from '@datasetai/core';

describe('InMemoryQueue (Story E5.1)', () => {
  it('enqueues a job, processes it once, drains', async () => {
    const queue = createInMemoryQueue();
    const seen: Array<Job<{ n: number }>> = [];

    queue.process<{ n: number }>('add', async (job) => {
      seen.push(job);
    });
    await queue.enqueue('add', { n: 1 });
    await queue.enqueue('add', { n: 2 });
    await queue.drain();

    expect(seen.length).toBe(2);
    expect(seen.map((j) => j.payload.n).sort()).toEqual([1, 2]);
    expect(queue.size()).toBe(0);
  });

  it('returns a unique job id for each enqueue', async () => {
    const queue = createInMemoryQueue();
    queue.process('noop', async () => {});
    const id1 = await queue.enqueue('noop', null);
    const id2 = await queue.enqueue('noop', null);
    expect(id1).not.toBe(id2);
    await queue.drain();
  });

  it('jobs without a registered handler are silently skipped (no crash)', async () => {
    const queue = createInMemoryQueue();
    await queue.enqueue('orphan', { x: 1 });
    await queue.drain();
    expect(queue.size()).toBe(0);
  });

  it('retries on handler error up to maxAttempts then gives up', async () => {
    let attempts = 0;
    const errors: Array<{ jobId: string; err: unknown }> = [];
    const queue = createInMemoryQueue({
      maxAttempts: 3,
      onError: (j, err) => errors.push({ jobId: j.id, err }),
    });
    queue.process('flaky', async () => {
      attempts += 1;
      throw new Error(`attempt ${attempts}`);
    });
    await queue.enqueue('flaky', null);
    await queue.drain();

    expect(attempts).toBe(3);
    expect(errors).toHaveLength(3);
    expect(queue.size()).toBe(0);
  });

  it('retry succeeds when the handler stops throwing on attempt 2', async () => {
    let attempts = 0;
    const queue = createInMemoryQueue({ maxAttempts: 3 });
    queue.process('eventually', async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('first attempt fails');
    });
    await queue.enqueue('eventually', null);
    await queue.drain();

    expect(attempts).toBe(2);
  });

  it('passes attempt count into the handler so jobs can branch on retry', async () => {
    const seen: number[] = [];
    const queue = createInMemoryQueue({ maxAttempts: 2 });
    queue.process('count', async (job) => {
      seen.push(job.attempts);
      throw new Error('always');
    });
    await queue.enqueue('count', null);
    await queue.drain();

    expect(seen).toEqual([1, 2]);
  });
});
