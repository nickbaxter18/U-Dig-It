import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookingsTable } from '../BookingsTable';

interface TestBooking {
  id: string;
  bookingNumber: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  equipment: {
    id: string;
    name: string;
    model: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  total: number;
  createdAt: string;
}

const buildBooking = (overrides: Partial<TestBooking> = {}): TestBooking => ({
  id: 'booking-1',
  bookingNumber: 'UDR-2025-001',
  customer: {
    id: 'user-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex@example.com',
  },
  equipment: {
    id: 'equipment-1',
    name: 'Kubota SVL-75',
    model: 'SVL75-2',
  },
  startDate: '2025-01-10T00:00:00Z',
  endDate: '2025-01-12T00:00:00Z',
  status: 'CONFIRMED',
  total: 1500,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const defaultBooking = buildBooking();

const buildProps = (overrides: Partial<React.ComponentProps<typeof BookingsTable>> = {}) => {
  const onBookingSelect = vi.fn();
  const onBookingUpdate = vi.fn();
  const onStatusUpdate = vi.fn();
  const onCancelBooking = vi.fn();
  const onPageChange = vi.fn();

  return {
    bookings: [defaultBooking],
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
    onBookingSelect,
    onBookingUpdate,
    onStatusUpdate,
    onCancelBooking,
    onPageChange,
    ...overrides,
  };
};

describe('BookingsTable', () => {
  it('renders loading state with status role', () => {
    render(<BookingsTable {...buildProps({ loading: true })} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders empty state message when no bookings provided', () => {
    render(<BookingsTable {...buildProps({ bookings: [] })} />);
    expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
  });

  it('renders booking information', () => {
    render(<BookingsTable {...buildProps()} />);

    expect(screen.getByText(defaultBooking.bookingNumber)).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText(/kubota svl-75/i)).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument();
  });

  it('opens action menu and triggers cancel booking after confirmation', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<BookingsTable {...props} />);

    const moreButton = screen.getByRole('button', { name: /more actions/i });
    await user.click(moreButton);

    const cancelButton = screen.getByText(/cancel booking/i);
    await user.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to cancel this booking?');
    expect(props.onCancelBooking).toHaveBeenCalledWith(defaultBooking.id);

    confirmSpy.mockRestore();
  });

  it('does not cancel booking if confirmation dismissed', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<BookingsTable {...props} />);

    const moreButton = screen.getByRole('button', { name: /more actions/i });
    await user.click(moreButton);

    const cancelButton = screen.getByText(/cancel booking/i);
    await user.click(cancelButton);

    expect(props.onCancelBooking).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('renders pagination summary text', () => {
    render(
      <BookingsTable
        {...buildProps({
          pagination: { page: 2, limit: 10, total: 30, totalPages: 3 },
        })}
      />
    );

    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
  });

  it('provides accessible names for action buttons', () => {
    render(<BookingsTable {...buildProps()} />);

    const viewButton = screen.getByRole('button', { name: /view booking details/i });
    const menuButton = screen.getByRole('button', { name: /more actions/i });

    expect(viewButton).toBeInTheDocument();
    expect(menuButton).toBeInTheDocument();
  });
});


