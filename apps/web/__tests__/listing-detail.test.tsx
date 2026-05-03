// Tests for Story E2.2 — Listing Detail Page.
// The route page hasn't shipped yet, but the data layer (lib/catalog.ts) has.
// We test the data layer's getAgentBySlug fallback path here, and todo-stub the route.

import { describe, expect, it } from 'vitest';
import { getAgentBySlug } from '../lib/catalog.js';
import { FIXTURE_CATALOG } from '../lib/fixtures.js';

describe('listing detail data layer (Story E2.2)', () => {
  it('getAgentBySlug returns the card + creator + versions for a known slug', async () => {
    const slug = FIXTURE_CATALOG[0]!.id;
    const result = await getAgentBySlug(slug);
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe(slug);
    expect(result!.versions.length).toBeGreaterThan(0);
  });

  it('getAgentBySlug returns null for an unknown slug', async () => {
    const result = await getAgentBySlug('does/not-exist');
    expect(result).toBeNull();
  });

  it('creator is hydrated when the agent has a creatorLogin', async () => {
    const slug = FIXTURE_CATALOG.find((a) => a.creatorLogin === 'voltagent')!.id;
    const result = await getAgentBySlug(slug);
    expect(result?.creator?.username).toBe('voltagent');
  });
});

describe('listing detail route (Story E2.2)', () => {
  it.todo(
    'GET /agents/<id> renders title, install-command snippet, version list, README — EXPECTS apps/web/app/agents/[id]/page.tsx to land',
  );
  it.todo(
    'mirrored listing shows source attribution + Claim CTA — EXPECTS E2.2 + E5.x',
  );
});
