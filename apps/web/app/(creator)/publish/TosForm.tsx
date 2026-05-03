'use client';

import { useState } from 'react';

interface Props {
  readonly accepted: { tos: boolean; privacy: boolean; creator: boolean };
}

export function TosForm({ accepted }: Props) {
  const [tos, setTos] = useState(accepted.tos);
  const [privacy, setPrivacy] = useState(accepted.privacy);
  const [creator, setCreator] = useState(accepted.creator);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = tos && privacy && creator;

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/me/accept-terms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tos, privacy, creator }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handle}
      className="max-w-xl space-y-4 rounded border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <h2 className="text-lg font-semibold">Accept publishing terms</h2>
      <p className="text-sm text-neutral-500">
        Required before your first publish. We don&apos;t resell your content.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={tos}
          onChange={(e) => setTos(e.target.checked)}
          className="mt-1"
        />
        <span>
          I agree to the <a href="/terms" className="underline">Terms of Service</a>.
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          className="mt-1"
        />
        <span>
          I agree to the <a href="/privacy" className="underline">Privacy Policy</a>.
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={creator}
          onChange={(e) => setCreator(e.target.checked)}
          className="mt-1"
        />
        <span>
          I agree to the <a href="/creator-agreement" className="underline">Creator Agreement</a>.
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!allChecked || submitting}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
