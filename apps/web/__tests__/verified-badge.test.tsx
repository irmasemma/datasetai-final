// Tests for Story E7.2 — Verified-Publisher Badge Display.
// Real component, no mocks.

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerifiedBadge } from '../components/VerifiedBadge.js';

describe('verified-publisher badge (Story E7.2)', () => {
  it('renders a "verified" marker with a tooltip-shaped title attribute', () => {
    render(<VerifiedBadge />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    const node = screen.getByText(/verified/i).closest('[title]') as HTMLElement | null;
    expect(node?.getAttribute('title')).toMatch(/verified publisher/i);
  });

  it('renders both sm and md sizes without throwing', () => {
    const { rerender } = render(<VerifiedBadge size="sm" />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    rerender(<VerifiedBadge size="md" />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it.todo(
    'badge renders next to creator name on the catalog card when creator.is_verified_publisher = true — EXPECTS AgentCard to read isVerifiedPublisher and embed VerifiedBadge',
  );
});
