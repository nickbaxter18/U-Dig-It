import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HowItWorksSection from '../HowItWorksSection';

describe('HowItWorksSection', () => {
  it('should render section heading', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
  });

  it('should render all steps', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText(/step 1|browse/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2|book/i)).toBeInTheDocument();
    expect(screen.getByText(/step 3|deliver|pickup/i)).toBeInTheDocument();
    expect(screen.getByText(/step 4|return/i)).toBeInTheDocument();
  });

  it('should display step descriptions', () => {
    render(<HowItWorksSection />);

    const descriptions = screen.getAllByText(/.{30,}/); // Long descriptions
    expect(descriptions.length).toBeGreaterThan(3);
  });

  it('should have step icons', () => {
    const { container } = render(<HowItWorksSection />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(3);
  });

  it('should have CTA button', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('link', { name: /get started|book now/i })).toBeInTheDocument();
  });

  it('should link to booking page', () => {
    render(<HowItWorksSection />);

    const ctaLink = screen.getByRole('link', { name: /get started|book/i });
    expect(ctaLink).toHaveAttribute('href', '/book');
  });
});

