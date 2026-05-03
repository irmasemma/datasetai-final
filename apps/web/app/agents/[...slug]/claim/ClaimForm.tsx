'use client';

import { useState } from 'react';

export function ClaimForm({ slug }: { slug: string }) {
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/v1/agents/${slug}/claim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proof }),
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

  if (done) {
    return <p className="text-sm text-green-600">Claim submitted. We&apos;ll email you within 72h.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm">
        Optional ownership proof (URL of a gist or commit on the upstream repo)
        <textarea
          rows={3}
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          className="mt-1 w-full rounded border border-border bg-card p-2 text-foreground placeholder:text-muted-foreground"
        />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit claim'}
      </button>
    </form>
  );
}
