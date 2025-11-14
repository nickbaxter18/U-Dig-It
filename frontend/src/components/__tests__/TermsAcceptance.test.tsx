import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TermsAcceptance from '../TermsAcceptance';

describe('TermsAcceptance', () => {
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render terms checkbox', () => {
    render(<TermsAcceptance onAccept={mockOnAccept} />);
    expect(screen.getByRole('checkbox', { name: /terms|agree/i })).toBeInTheDocument();
  });

  it('should link to terms page', () => {
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const termsLink = screen.getByRole('link', { name: /terms.*conditions/i });
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('should link to privacy page', () => {
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const privacyLink = screen.getByRole('link', { name: /privacy.*policy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('should call onAccept when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i });
    await user.click(checkbox);

    expect(mockOnAccept).toHaveBeenCalledWith(true);
  });

  it('should call onAccept with false when unchecked', async () => {
    const user = userEvent.setup();
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i });

    await user.click(checkbox); // Check
    await user.click(checkbox); // Uncheck

    expect(mockOnAccept).toHaveBeenLastCalledWith(false);
  });

  it('should start unchecked by default', () => {
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox', { name: /terms/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('should be accessible', () => {
    render(<TermsAcceptance onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName();
  });
});

