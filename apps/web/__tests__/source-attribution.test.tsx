// Tests for Story E5.7 — Source Attribution Rendering.
// Real AgentCard component, real props. The card is what catalog uses today.
// E5.7 says a mirrored listing must show "mirrored from <source>" + claim CTA;
// the AgentCard already shows mirrored-from on the card per Round 1 implementation.
// Listing-detail-page banner is a separate component the implementer hasn't shipped.

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '../components/AgentCard.js';
import type { AgentCard as AgentCardData } from '@datasetai/db';

const MIRRORED_FIXTURE: AgentCardData = {
  id: 'voltagent/mirrored-skill',
  name: 'Mirrored Skill',
  description: 'A skill mirrored from VoltAgent.',
  primaryFormat: 'claude-skill',
  formats: ['claude-skill'],
  toolCompatibility: ['claude-code'],
  category: 'mirrored',
  tags: ['mirror'],
  license: 'MIT',
  creatorLogin: null, // unclaimed
  sourceType: 'voltagent-mirror',
  installCount30d: 100,
  installCountLifetime: 200,
  updatedAt: new Date('2026-04-01T00:00:00Z'),
};

describe('source attribution on AgentCard (Story E5.7)', () => {
  it('renders "mirrored from <source>" when creatorLogin is null and sourceType is a mirror', () => {
    render(<AgentCard agent={MIRRORED_FIXTURE} />);
    // Match the byline (sub-line containing the mirror tag) — the description below
    // can also contain "mirrored" text, so we look for the source-type slug.
    expect(screen.getByText(/mirrored from voltagent-mirror/i)).toBeInTheDocument();
  });

  it('renders "by <creatorLogin>" byline once the listing has been claimed', () => {
    const claimed = { ...MIRRORED_FIXTURE, creatorLogin: 'alice' };
    render(<AgentCard agent={claimed} />);
    expect(screen.getByText(/by alice/i)).toBeInTheDocument();
    // The mirror-source slug should not appear on the byline now.
    expect(screen.queryByText(/mirrored from voltagent-mirror/i)).toBeNull();
  });

  it('upstream license is rendered prominently on the card', () => {
    render(<AgentCard agent={MIRRORED_FIXTURE} />);
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it.todo(
    'listing detail page renders a SourceBadge banner with upstream URL + Claim CTA — EXPECTS apps/web/components/SourceBadge.tsx + listing detail page',
  );
});
