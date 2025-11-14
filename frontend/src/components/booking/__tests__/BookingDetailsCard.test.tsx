import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookingDetailsCard } from '../BookingDetailsCard';
import { createTestBooking, createTestUser, createTestEquipment } from '@/test-utils';

describe('BookingDetailsCard', () => {
  const user = createTestUser();
  const equipment = createTestEquipment();
  const booking = createTestBooking({ customerId: user.id, equipmentId: equipment.id });

  it('should render booking number', () => {
    render(<BookingDetailsCard booking={booking} />);
    expect(screen.getByText(booking.bookingNumber)).toBeInTheDocument();
  });

  it('should display booking status badge', () => {
    render(<BookingDetailsCard booking={booking} />);
    expect(screen.getByText(booking.status)).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<BookingDetailsCard booking={booking} />);
    const dates = screen.getAllByText(/2025|jan|feb|mar|apr|may/i);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('should display total amount as currency', () => {
    const booking = createTestBooking({ totalAmount: 1234.56 });
    render(<BookingDetailsCard booking={booking} />);
    expect(screen.getByText(/\$1,234\.56/)).toBeInTheDocument();
  });

  it('should show delivery address', () => {
    render(<BookingDetailsCard booking={booking} />);
    expect(screen.getByText(booking.deliveryAddress)).toBeInTheDocument();
  });
});


