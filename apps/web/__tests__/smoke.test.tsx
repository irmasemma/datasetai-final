// Smoke tests for category / tag / creator pages (Stories E2.6 + E2.7).
// Per scope: don't fully assert UI — just verify modules import without error.

import { describe, it } from 'vitest';

describe('catalog secondary pages — import smoke (E2.6 + E2.7)', () => {
  it.todo('apps/web/app/categories/page.tsx imports — EXPECTS E2.6 page landing');
  it.todo('apps/web/app/categories/[slug]/page.tsx imports — EXPECTS E2.6');
  it.todo('apps/web/app/tags/[tag]/page.tsx imports — EXPECTS E2.7');
  it.todo('apps/web/app/u/[handle]/page.tsx imports — EXPECTS E2.7');
});
