import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailCustomerModal } from '../EmailCustomerModal';
import { createFullBooking } from '@/test-utils';

describe('EmailCustomerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSend = vi.fn();
  const { booking, user: customer } = createFullBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<EmailCustomerModal isOpen={true} booking={booking} onClose={mockOnClose} onSend={mockOnSend} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should pre-fill customer email', () => {
    const fullBooking = { ...booking, customer };
    render(<EmailCustomerModal isOpen={true} booking={fullBooking} onClose={mockOnClose} onSend={mockOnSend} />);

    expect(screen.getByDisplayValue(customer.email)).toBeInTheDocument();
  });

  it('should require subject', async () => {
    const user = userEvent.setup();
    render(<EmailCustomerModal isOpen={true} booking={booking} onClose={mockOnClose} onSend={mockOnSend} />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/subject.*required/i)).toBeInTheDocument();
    });
  });

  it('should require message', async () => {
    const user = userEvent.setup();
    render(<EmailCustomerModal isOpen={true} booking={booking} onClose={mockOnClose} onSend={mockOnSend} />);

    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/message.*required/i)).toBeInTheDocument();
    });
  });

  it('should call onSend with email data', async () => {
    const user = userEvent.setup();
    render(<EmailCustomerModal isOpen={true} booking={booking} onClose={mockOnClose} onSend={mockOnSend} />);

    await user.type(screen.getByLabelText(/subject/i), 'Booking Update');
    await user.type(screen.getByLabelText(/message/i), 'Your booking is confirmed');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Booking Update',
          message: 'Your booking is confirmed',
        })
      );
    });
  });

  it('should show loading state during send', async () => {
    const user = userEvent.setup();
    mockOnSend.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<EmailCustomerModal isOpen={true} booking={booking} onClose={mockOnClose} onSend={mockOnSend} />);

    await user.type(screen.getByLabelText(/subject/i), 'Test');
    await user.type(screen.getByLabelText(/message/i), 'Message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });
});


