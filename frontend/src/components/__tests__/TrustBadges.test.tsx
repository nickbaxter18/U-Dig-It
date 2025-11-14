import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TrustBadges from '../TrustBadges';

describe('TrustBadges', () => {
  it('should render trust badges', () => {
    render(<TrustBadges />);
    expect(screen.getByText(/trusted|verified|secure/i)).toBeInTheDocument();
  });

  it('should display insurance badge', () => {
    render(<TrustBadges />);
    expect(screen.getByText(/insured|insurance/i)).toBeInTheDocument();
  });

  it('should display licensed badge', () => {
    render(<TrustBadges />);
    expect(screen.getByText(/licensed/i)).toBeInTheDocument();
  });

  it('should display secure payment badge', () => {
    render(<TrustBadges />);
    expect(screen.getByText(/secure.*payment|stripe/i)).toBeInTheDocument();
  });

  it('should render badge icons', () => {
    const { container } = render(<TrustBadges />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have accessible labels', () => {
    render(<TrustBadges />);

    const badges = screen.getAllByRole('img');
    badges.forEach(badge => {
      expect(badge).toHaveAttribute('alt');
    });
  });
});

