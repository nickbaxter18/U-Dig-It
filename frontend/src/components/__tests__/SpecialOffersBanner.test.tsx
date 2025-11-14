import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SpecialOffersBanner from '../SpecialOffersBanner';

describe('SpecialOffersBanner', () => {
  it('should render banner', () => {
    render(<SpecialOffersBanner />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display offer text', () => {
    const offer = { text: '10% off first rental', code: 'FIRST10' };
    render(<SpecialOffersBanner offer={offer} />);

    expect(screen.getByText(/10% off/i)).toBeInTheDocument();
  });

  it('should show CTA button', () => {
    render(<SpecialOffersBanner />);
    expect(screen.getByRole('link', { name: /book now|claim offer/i })).toBeInTheDocument();
  });

  it('should be dismissible', async () => {
    const user = userEvent.setup();
    const { container } = render(<SpecialOffersBanner dismissible={true} />);

    const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
    await user.click(closeButton);

    expect(container.firstChild).toBeNull();
  });

  it('should link to booking page', () => {
    render(<SpecialOffersBanner />);

    const ctaLink = screen.getByRole('link', { name: /book/i });
    expect(ctaLink).toHaveAttribute('href', expect.stringContaining('/book'));
  });

  it('should display expiry date', () => {
    const offer = { text: '10% off', expiresAt: '2025-12-31' };
    render(<SpecialOffersBanner offer={offer} />);

    expect(screen.getByText(/expires|valid until/i)).toBeInTheDocument();
  });
});

