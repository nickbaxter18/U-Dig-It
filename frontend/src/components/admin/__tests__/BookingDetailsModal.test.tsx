import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingDetailsModal } from '../BookingDetailsModal';
import { createTestBooking, createFullBooking } from '@/test-utils';

describe('BookingDetailsModal', () => {
  const mockOnClose = vi.fn();
  const { booking, user: customer, equipment } = createFullBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(<BookingDetailsModal isOpen={false} booking={booking} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display booking number', () => {
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);
    expect(screen.getByText(booking.bookingNumber)).toBeInTheDocument();
  });

  it('should display customer information', () => {
    const fullBooking = { ...booking, customer };
    render(<BookingDetailsModal isOpen={true} booking={fullBooking} onClose={mockOnClose} />);

    expect(screen.getByText(customer.firstName)).toBeInTheDocument();
    expect(screen.getByText(customer.email)).toBeInTheDocument();
  });

  it('should display equipment details', () => {
    const fullBooking = { ...booking, equipment };
    render(<BookingDetailsModal isOpen={true} booking={fullBooking} onClose={mockOnClose} />);

    expect(screen.getByText(/kubota|svl/i)).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);

    const dates = screen.getAllByText(/2025|jan|feb/i);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('should display total amount', () => {
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);
    expect(screen.getByText(/\$1,050/)).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have action buttons for booking management', () => {
    render(<BookingDetailsModal isOpen={true} booking={booking} onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /edit|update/i })).toBeInTheDocument();
  });
});


