'use client';

import { useState } from 'react';

interface Props {
  readonly licenses: readonly string[];
}

export function PublishForm({ licenses }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; slug?: string } | null>(
    null,
  );

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch('/api/v1/publish', { method: 'POST', body: fd });
      const body = (await res.json()) as { ok?: boolean; slug?: string; message?: string; error?: string };
      if (!res.ok) {
        setResult({ ok: false, message: body.message ?? body.error ?? `HTTP ${res.status}` });
      } else {
        setResult({ ok: true, slug: body.slug });
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handle}
      encType="multipart/form-data"
      className="grid max-w-2xl grid-cols-1 gap-4 rounded border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <Field label="Slug" name="slug" placeholder="your-handle/agent-name" required />
      <Field label="Name" name="name" required />
      <Field label="Summary" name="summary" required />
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Description (markdown)</span>
        <textarea
          name="description"
          rows={5}
          required
          className="w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="block font-medium">README.md</span>
        <textarea
          name="readme"
          rows={6}
          required
          className="w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <Field label="Version" name="version" defaultValue="0.1.0" required />
      <Field label="Category" name="category" placeholder="code-review, data, …" />
      <Field label="Tags (comma separated)" name="_tagsCsv" placeholder="typescript, review" />
      <label className="space-y-1 text-sm">
        <span className="block font-medium">License (required)</span>
        <select
          name="license"
          required
          className="w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {licenses.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Files (folder upload)</span>
        <input
          name="files"
          type="file"
          multiple
          className="w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {result && !result.ok && (
        <p className="text-sm text-red-600">Publish failed: {result.message}</p>
      )}
      {result && result.ok && (
        <p className="text-sm text-green-600">
          Published. View at <a href={`/agents/${result.slug}`} className="underline">/agents/{result.slug}</a>
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? 'Publishing…' : 'Publish'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  ...rest
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      <input
        name={name}
        {...rest}
        className="w-full rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </label>
  );
}
