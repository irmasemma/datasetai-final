'use client';

import { useState } from 'react';

export function SuppressionForm() {
  const [agentId, setAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/v1/admin/suppressions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'agent', agentId, reason }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        Agent ID
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          required
          className="block rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="text-sm">
        Reason
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="block rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {err && <span className="text-sm text-red-600">{err}</span>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        Suppress
      </button>
    </form>
  );
}
