// Tests for Story E2.1 — Public Catalog Page.
// Asserts the catalog renders cards with title, creator, install-count, format badges.
// We assert against the AgentCard + CatalogGrid components that the implementer has
// landed; the route page (apps/web/app/agents/page.tsx) hasn't shipped yet so its
// test is todo-stubbed.

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '../components/AgentCard.js';
import { CatalogGrid } from '../components/CatalogGrid.js';
import { FIXTURE_CATALOG, DEMO_FIXTURES } from '../lib/fixtures.js';

describe('catalog: AgentCard component (Story E2.1)', () => {
  const sample = FIXTURE_CATALOG[0]!;

  it('renders the agent name and description', () => {
    render(<AgentCard agent={sample} />);
    expect(screen.getByText(sample.name)).toBeInTheDocument();
    expect(screen.getByText(sample.description)).toBeInTheDocument();
  });

  it('renders the install count (30d) on the card', () => {
    render(<AgentCard agent={sample} />);
    // Be lenient about formatting — match the digits.
    const counts = screen.getAllByText(new RegExp(sample.installCount30d.toLocaleString().replace(/[.,]/g, '[.,]?')));
    expect(counts.length).toBeGreaterThan(0);
  });

  it('renders a format badge', () => {
    render(<AgentCard agent={sample} />);
    expect(screen.getByText(/Claude Skill|MCP Server|AGENTS\.md/i)).toBeInTheDocument();
  });

  it('renders creator handle (or mirrored-from attribution)', () => {
    render(<AgentCard agent={sample} />);
    if (sample.creatorLogin) {
      expect(screen.getByText(new RegExp(sample.creatorLogin, 'i'))).toBeInTheDocument();
    } else {
      expect(screen.getByText(/mirrored from/i)).toBeInTheDocument();
    }
  });

  it('shows the listing link to /agents/<id>', () => {
    render(<AgentCard agent={sample} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(`/agents/${sample.id}`);
  });
});

describe('catalog: CatalogGrid component (Story E2.1)', () => {
  it('renders one card per agent', () => {
    render(<CatalogGrid agents={DEMO_FIXTURES} />);
    for (const agent of DEMO_FIXTURES) {
      expect(screen.getByText(agent.name)).toBeInTheDocument();
    }
  });

  it('shows zero-state when given an empty list', () => {
    render(<CatalogGrid agents={[]} />);
    expect(screen.getByText(/no agents match/i)).toBeInTheDocument();
  });

  it('exposes an aria-label on the list for screen readers (NFR-ACC-2)', () => {
    render(<CatalogGrid agents={DEMO_FIXTURES} />);
    expect(screen.getByLabelText(/agent catalog/i)).toBeInTheDocument();
  });
});

describe('catalog page route (Story E2.1)', () => {
  it.todo(
    'GET /agents renders SSR catalog with paginated cards — EXPECTS apps/web/app/agents/page.tsx to land',
  );
  it.todo('homepage / surfaces catalog grid (or recently-viewed when applicable) — EXPECTS E2.1');
});
