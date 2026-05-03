// Tests for Story E1.7 — Observability Foundation.
// Asserts the @datasetai/core observability surface (PostHog + Sentry wrappers)
// no-ops when env vars are missing, and forwards to the underlying SDK / delegate
// when configured.

import { describe, expect, it, vi } from 'vitest';
import {
  createPosthogClient,
  createSentryClient,
  EVENTS,
} from '@datasetai/core';

describe('observability — PostHog wrapper (Story E1.7)', () => {
  it('returns a NOOP client when apiKey is undefined', () => {
    const client = createPosthogClient({ apiKey: undefined });
    expect(() => client.track(EVENTS.installAttempted, { agent_id: 'foo/bar' })).not.toThrow();
  });

  it('returns a NOOP client when explicitly disabled', () => {
    const client = createPosthogClient({ apiKey: 'phc_xxx', enabled: false });
    expect(() => client.track(EVENTS.installSucceeded)).not.toThrow();
  });

  it('flush + shutdown on a NOOP client resolve without throwing', async () => {
    const client = createPosthogClient({ apiKey: undefined });
    await expect(client.flush()).resolves.toBeUndefined();
    await expect(client.shutdown()).resolves.toBeUndefined();
  });

  it('event taxonomy includes required Story E1.7 events', () => {
    // §4.9 events from the Architecture doc — ensure none are missing.
    expect(EVENTS.searchPerformed).toBe('search_performed');
    expect(EVENTS.listingViewed).toBe('listing_viewed');
    expect(EVENTS.installAttempted).toBe('install_attempted');
    expect(EVENTS.installSucceeded).toBe('install_succeeded');
    expect(EVENTS.installFailed).toBe('install_failed');
    expect(EVENTS.agentPublished).toBe('agent_published');
    expect(EVENTS.listingClaimed).toBe('listing_claimed');
    expect(EVENTS.reportSubmitted).toBe('report_submitted');
  });
});

describe('observability — Sentry wrapper (Story E1.7)', () => {
  it('returns a NOOP client when DSN is undefined', () => {
    const client = createSentryClient({ dsn: undefined });
    expect(() => client.captureException(new Error('boom'))).not.toThrow();
    expect(() => client.captureMessage('hi')).not.toThrow();
    expect(() => client.setUser(null)).not.toThrow();
  });

  it('forwards to the delegate when DSN is set', () => {
    const captureException = vi.fn();
    const captureMessage = vi.fn();
    const setUser = vi.fn();
    const delegate = { captureException, captureMessage, setUser };
    const client = createSentryClient({ dsn: 'https://sentry.example' }, delegate);
    const err = new Error('boom');
    client.captureException(err, { route: '/install' });
    client.captureMessage('warn', 'warning');
    client.setUser({ id: 'u1', email: 'x@y' });
    expect(captureException).toHaveBeenCalledWith(err, { route: '/install' });
    expect(captureMessage).toHaveBeenCalledWith('warn', 'warning');
    expect(setUser).toHaveBeenCalledWith({ id: 'u1', email: 'x@y' });
  });

  it('does NOT forward to the delegate when DSN is undefined (NOOP wins)', () => {
    const captureException = vi.fn();
    const delegate = {
      captureException,
      captureMessage: vi.fn(),
      setUser: vi.fn(),
    };
    const client = createSentryClient({ dsn: undefined }, delegate);
    client.captureException(new Error('boom'));
    expect(captureException).not.toHaveBeenCalled();
  });
});
