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
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Report
      </button>
    );
  }
  if (done) return <span className="text-xs text-green-600">Reported. Thanks.</span>;
  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded border border-border bg-card p-3"
    >
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded border border-border bg-card p-1 text-sm text-foreground"
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
        className="w-full rounded border border-border bg-card p-1 text-sm text-foreground placeholder:text-muted-foreground"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-muted-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-foreground px-2 py-1 text-background disabled:opacity-50"
        >
          {submitting ? 'Reporting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
