import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationHoldPayment } from '../VerificationHoldPayment';
import { createTestBooking } from '@/test-utils';

describe('VerificationHoldPayment', () => {
  const mockOnComplete = vi.fn();
  const booking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render verification hold section', () => {
    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);
    expect(screen.getByText(/\$1\.00|verification/i)).toBeInTheDocument();
  });

  it('should explain $1 verification charge', () => {
    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);
    expect(screen.getByText(/verify.*card|\$1.*00/i)).toBeInTheDocument();
  });

  it('should have verify button', () => {
    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('should create verification hold when clicking verify', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clientSecret: 'secret_123' }),
    });

    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await user.click(verifyButton);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/place-verify-hold'),
      expect.any(Object)
    );
  });

  it('should show loading state during verification', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await user.click(verifyButton);

    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    expect(verifyButton).toBeDisabled();
  });

  it('should call onComplete when verification succeeds', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('should handle verification errors', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Card declined' }),
    });

    render(<VerificationHoldPayment booking={booking} onComplete={mockOnComplete} />);

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/declined|error/i)).toBeInTheDocument();
    });
  });
});


