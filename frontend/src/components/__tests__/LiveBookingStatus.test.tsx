import { createTestBooking } from '@/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LiveBookingStatus from '../LiveBookingStatus';

const mockSupabase = {
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('LiveBookingStatus', () => {
  const booking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render booking status', () => {
    render(<LiveBookingStatus bookingId={booking.id} />);
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('should subscribe to realtime updates', () => {
    render(<LiveBookingStatus bookingId={booking.id} />);

    expect(mockSupabase.channel).toHaveBeenCalled();
  });

  it('should display current booking status', () => {
    render(<LiveBookingStatus bookingId={booking.id} initialStatus="CONFIRMED" />);
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('should update status when receiving realtime event', async () => {
    let callback: unknown;
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockImplementation((event, filter, cb) => {
        callback = cb;
        return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
      }),
      subscribe: vi.fn(),
    });

    render(<LiveBookingStatus bookingId={booking.id} initialStatus="PENDING" />);

    // Simulate status update from realtime
    callback({ new: { status: 'CONFIRMED' } });

    await waitFor(() => {
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    });
  });

  it('should cleanup subscription on unmount', () => {
    const { unmount } = render(<LiveBookingStatus bookingId={booking.id} />);

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});
