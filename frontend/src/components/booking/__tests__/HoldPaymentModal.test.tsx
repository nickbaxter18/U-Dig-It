import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoldPaymentModal } from '../HoldPaymentModal';
import { createTestBooking } from '@/test-utils';

describe('HoldPaymentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();
  const booking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<HoldPaymentModal isOpen={true} booking={booking} onClose={mockOnClose} onComplete={mockOnComplete} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(<HoldPaymentModal isOpen={false} booking={booking} onClose={mockOnClose} onComplete={mockOnComplete} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display hold amount', () => {
    render(<HoldPaymentModal isOpen={true} booking={booking} onClose={mockOnClose} onComplete={mockOnComplete} />);
    expect(screen.getByText(/\$500|\$1\.00/)).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    render(<HoldPaymentModal isOpen={true} booking={booking} onClose={mockOnClose} onComplete={mockOnComplete} />);

    const closeButton = screen.getByRole('button', { name: /close|cancel/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onComplete when payment succeeds', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clientSecret: 'secret_123' }),
    });

    render(<HoldPaymentModal isOpen={true} booking={booking} onClose={mockOnClose} onComplete={mockOnComplete} />);

    const confirmButton = screen.getByRole('button', { name: /confirm|verify card/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});


