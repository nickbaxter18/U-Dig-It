import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserDashboard from '../UserDashboard';
import { createTestBooking, createTestUser } from '@/test-utils';

const mockUser = createTestUser();
const mockUseAuth = vi.fn();
const mockSupabaseApi = {
  getBookings: vi.fn(),
};

vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase/api-client', () => ({
  supabaseApi: mockSupabaseApi,
}));

vi.mock('../Navigation', () => ({ default: () => <div>Navigation</div> }));
vi.mock('../Footer', () => ({ default: () => <div>Footer</div> }));

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockSupabaseApi.getBookings.mockResolvedValue([]);
  });

  describe('Initial Render', () => {
    it('should show loading state initially', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: true });
      render(<UserDashboard />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render dashboard after loading', async () => {
      render(<UserDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    it('should fetch user bookings on mount', async () => {
      render(<UserDashboard />);
      await waitFor(() => {
        expect(mockSupabaseApi.getBookings).toHaveBeenCalledWith({ userId: mockUser.id, limit: 10 });
      });
    });
  });

  describe('Stats Display', () => {
    it('should display total bookings stat', async () => {
      const bookings = [createTestBooking(), createTestBooking()];
      mockSupabaseApi.getBookings.mockResolvedValue(bookings);

      render(<UserDashboard />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
      });
    });

    it('should calculate total spent correctly', async () => {
      const bookings = [
        createTestBooking({ totalAmount: 500 }),
        createTestBooking({ totalAmount: 750 }),
      ];
      mockSupabaseApi.getBookings.mockResolvedValue(bookings);

      render(<UserDashboard />);
      await waitFor(() => {
        expect(screen.getByText('$1,250.00')).toBeInTheDocument();
      });
    });

    it('should count upcoming bookings correctly', async () => {
      const bookings = [
        createTestBooking({ status: 'confirmed' }),
        createTestBooking({ status: 'pending' }),
        createTestBooking({ status: 'completed' }),
      ];
      mockSupabaseApi.getBookings.mockResolvedValue(bookings);

      render(<UserDashboard />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // confirmed + pending
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should default to upcoming tab', async () => {
      render(<UserDashboard />);
      await waitFor(() => {
        const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
        expect(upcomingTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should switch to past tab', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument());

      const pastTab = screen.getByRole('button', { name: /past/i });
      await user.click(pastTab);

      expect(pastTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should filter bookings by tab selection', async () => {
      const user = userEvent.setup();
      const bookings = [
        createTestBooking({ status: 'confirmed', bookingNumber: 'UDR-2025-001' }),
        createTestBooking({ status: 'completed', bookingNumber: 'UDR-2025-002' }),
      ];
      mockSupabaseApi.getBookings.mockResolvedValue(bookings);

      render(<UserDashboard />);

      await waitFor(() => expect(screen.getByText('UDR-2025-001')).toBeInTheDocument());

      // Switch to past tab
      const pastTab = screen.getByRole('button', { name: /past/i });
      await user.click(pastTab);

      // Should only show completed bookings
      expect(screen.queryByText('UDR-2025-001')).not.toBeInTheDocument();
      expect(screen.getByText('UDR-2025-002')).toBeInTheDocument();
    });
  });

  describe('Booking Cancellation', () => {
    it('should show cancel button for upcoming bookings', async () => {
      const booking = createTestBooking({ status: 'confirmed' });
      mockSupabaseApi.getBookings.mockResolvedValue([booking]);

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel booking/i })).toBeInTheDocument();
      });
    });

    it('should not show cancel button for completed bookings', async () => {
      const booking = createTestBooking({ status: 'completed' });
      mockSupabaseApi.getBookings.mockResolvedValue([booking]);

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no bookings', async () => {
      mockSupabaseApi.getBookings.mockResolvedValue([]);

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
      });
    });

    it('should show CTA to create first booking', async () => {
      mockSupabaseApi.getBookings.mockResolvedValue([]);

      render(<UserDashboard />);

      await waitFor(() => {
        const bookNowLink = screen.getByRole('link', { name: /book now|new booking/i });
        expect(bookNowLink).toHaveAttribute('href', '/book');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockSupabaseApi.getBookings.mockRejectedValue(new Error('API error'));

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show empty state or error message
      expect(screen.getByText(/no bookings|error/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /new booking/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      });
    });
  });
});


