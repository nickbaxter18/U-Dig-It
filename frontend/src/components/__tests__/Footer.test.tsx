import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '../Footer';

describe('Footer', () => {
  it('should render footer', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should display company name', () => {
    render(<Footer />);
    expect(screen.getByText(/u-dig it|kubota/i)).toBeInTheDocument();
  });

  it('should have contact information', () => {
    render(<Footer />);
    expect(screen.getByText(/506|contact/i)).toBeInTheDocument();
  });

  it('should link to terms', () => {
    render(<Footer />);
    const termsLink = screen.getByRole('link', { name: /terms/i });
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('should link to privacy policy', () => {
    render(<Footer />);
    const privacyLink = screen.getByRole('link', { name: /privacy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('should display copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/©|copyright|2025/i)).toBeInTheDocument();
  });

  it('should have social media links', () => {
    render(<Footer />);
    const socialLinks = screen.getAllByRole('link', { name: /facebook|twitter|instagram/i });
    expect(socialLinks.length).toBeGreaterThan(0);
  });

  it('should display all footer sections', () => {
    render(<Footer />);

    expect(screen.getByText(/about/i)).toBeInTheDocument();
    expect(screen.getByText(/services/i)).toBeInTheDocument();
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
  });
});

