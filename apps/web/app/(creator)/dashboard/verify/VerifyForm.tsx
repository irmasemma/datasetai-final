'use client';

import { useState } from 'react';

export function VerifyForm({ defaultGithub }: { defaultGithub: string }) {
  const [github, setGithub] = useState(defaultGithub);
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/v1/verifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ githubHandle: github, reasoning }),
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

  if (done) return <p className="text-sm text-green-600">Submitted. We&apos;ll review within a week.</p>;
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        GitHub handle
        <input
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="block text-sm">
        Why should we verify you?
        <textarea
          rows={4}
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
