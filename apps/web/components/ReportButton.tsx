'use client';

import { useState } from 'react';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'license-violation', label: 'License violation' },
  { value: 'malicious-content', label: 'Malicious content / prompt injection' },
  { value: 'broken', label: 'Broken / non-functional' },
  { value: 'other', label: 'Other' },
] as const;

export function ReportButton({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/v1/reports`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentId, reason, details }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="text-xs text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-200"
      >
        Report
      </button>
    );
  }
  if (done) return <span className="text-xs text-green-600">Reported. Thanks.</span>;
  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded border border-neutral-300 bg-white p-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Optional context"
        rows={3}
        className="w-full rounded border border-neutral-300 bg-white p-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-neutral-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-neutral-900 px-2 py-1 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? 'Reporting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
