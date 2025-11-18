import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TermsAcceptance from '../TermsAcceptance';

describe('TermsAcceptance', () => {
  const mockOnAcceptanceChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render terms checkbox', () => {
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);
    expect(screen.getByRole('checkbox', { name: /terms|agree/i })).toBeInTheDocument();
  });

  it('should link to terms page', () => {
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    // Component has multiple terms links, get all and check first one
    const termsLinks = screen.getAllByRole('link', { name: /terms.*conditions/i });
    expect(termsLinks.length).toBeGreaterThan(0);
    expect(termsLinks[0]).toHaveAttribute('href', '/terms');
  });

  it('should link to privacy page', () => {
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    // Component has multiple privacy links, get all and check first one
    const privacyLinks = screen.getAllByRole('link', { name: /privacy policy/i });
    expect(privacyLinks.length).toBeGreaterThan(0);
    expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
  });

  it('should call onAcceptanceChange when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(checkbox);

    expect(mockOnAcceptanceChange).toHaveBeenCalledWith(true);
  });

  it('should call onAcceptanceChange with false when unchecked', async () => {
    const user = userEvent.setup();
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i });

    await user.click(checkbox); // Check
    await user.click(checkbox); // Uncheck

    expect(mockOnAcceptanceChange).toHaveBeenLastCalledWith(false);
  });

  it('should start unchecked by default', () => {
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('should be accessible', () => {
    render(<TermsAcceptance onAcceptanceChange={mockOnAcceptanceChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName();
  });
});

