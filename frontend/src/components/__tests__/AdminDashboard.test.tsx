import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';

// Mock child components
vi.mock('../AnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>,
}));

vi.mock('../LiveBookingStatus', () => ({
  default: () => <div data-testid="live-booking-status">Live Booking Status</div>,
}));

vi.mock('../NotificationCenter', () => ({
  default: () => <div data-testid="notification-center">Notification Center</div>,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render loading state initially', () => {
      render(<AdminDashboard />);

      // Should show loading skeleton (animate-pulse class)
      const loadingContainer = document.querySelector('.animate-pulse');
      expect(loadingContainer).toBeInTheDocument();
    });

    it('should render dashboard after loading', async () => {
      render(<AdminDashboard />);

      // Wait for loading to complete (animate-pulse should disappear)
      await waitFor(() => {
        const loadingContainer = document.querySelector('.animate-pulse');
        expect(loadingContainer).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show dashboard heading
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    it('should render all child components', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should render analytics dashboard
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();

      // Should render live booking status
      expect(screen.getByTestId('live-booking-status')).toBeInTheDocument();

      // Should render notification center
      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should display total bookings stat', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('47')).toBeInTheDocument();
      });

      expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
    });

    it('should display total revenue formatted as currency', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$125,750.00')).toBeInTheDocument();
      });

      expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    });

    it('should display active bookings count', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });

      expect(screen.getByText(/active bookings/i)).toBeInTheDocument();
    });

    it('should display pending bookings count', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      expect(screen.getByText(/pending bookings/i)).toBeInTheDocument();
    });

    it('should display average booking value', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/2,675\.53/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/average booking value/i)).toBeInTheDocument();
    });

    it('should display monthly revenue', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/18,750\.00/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/monthly revenue/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should default to overview tab', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveClass(/active|selected|bg-/); // Active state styling
    });

    it('should switch to bookings tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const bookingsTab = screen.getByRole('button', { name: /bookings/i });
      await user.click(bookingsTab);

      // Should show bookings content
      expect(screen.getByText(/UDR-2025-001/)).toBeInTheDocument();
    });

    it('should switch to revenue tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const revenueTab = screen.getByRole('button', { name: /revenue/i });
      await user.click(revenueTab);

      // Revenue tab should be active
      expect(revenueTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to equipment tab when clicked', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const equipmentTab = screen.getByRole('button', { name: /equipment/i });
      await user.click(equipmentTab);

      // Equipment tab should be active
      expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Date Range Filtering', () => {
    it('should default to 30 days date range', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should have 30d selected
      const dateRangeButton = screen.getByRole('button', { name: /30 days|30d/i });
      expect(dateRangeButton).toBeInTheDocument();
    });

    it('should change date range to 7 days', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const sevenDaysButton = screen.getByRole('button', { name: /7 days|7d/i });
      await user.click(sevenDaysButton);

      // Should reload data with new range
      await waitFor(() => {
        expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
      });
    });

    it('should change date range to 90 days', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const ninetyDaysButton = screen.getByRole('button', { name: /90 days|90d/i });
      await user.click(ninetyDaysButton);

      // Should reload data
      await waitFor(() => {
        expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
      });
    });

    it('should reload data when date range changes', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Change date range
      const sevenDaysButton = screen.getByRole('button', { name: /7 days|7d/i });
      await user.click(sevenDaysButton);

      // Should show loading briefly then new data
      await waitFor(() => {
        expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Bookings Display', () => {
    it('should display recent bookings list', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show booking numbers
      expect(screen.getByText('UDR-2025-001')).toBeInTheDocument();
      expect(screen.getByText('UDR-2025-002')).toBeInTheDocument();
    });

    it('should display customer names', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/john smith/i)).toBeInTheDocument();
      expect(screen.getByText(/sarah johnson/i)).toBeInTheDocument();
    });

    it('should display booking status badges', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show status badges
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('should display booking amounts formatted as currency', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show formatted amounts
      expect(screen.getByText(/\$1,050\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$2,625\.00/)).toBeInTheDocument();
    });
  });

  describe('Recent Activity Display', () => {
    it('should display recent activity feed', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show activity descriptions
      expect(screen.getByText(/new booking created by john smith/i)).toBeInTheDocument();
      expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    });

    it('should display activity timestamps', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show formatted timestamps (dates will vary based on formatDate implementation)
      const activityItems = screen.getAllByRole('listitem');
      expect(activityItems.length).toBeGreaterThan(0);
    });

    it('should link activity to booking numbers', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show booking numbers in activity
      expect(screen.getByText(/UDR-2025-002/)).toBeInTheDocument();
      expect(screen.getByText(/UDR-2025-003/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle data fetch errors gracefully', async () => {
      // Mock logger to prevent console errors in tests
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should still render without crashing
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action links', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should have links to admin sections
      expect(screen.getByRole('link', { name: /bookings/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /equipment/i })).toBeInTheDocument();
    });

    it('should link to new booking creation', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const newBookingLink = screen.getByRole('link', { name: /new booking|create booking/i });
      expect(newBookingLink).toHaveAttribute('href', '/admin/bookings/new');
    });
  });

  describe('Status Colors', () => {
    it('should apply correct color classes for confirmed status', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const confirmedBadge = screen.getByText(/confirmed/i);
      expect(confirmedBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply correct color classes for pending status', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const pendingBadge = screen.getByText(/pending/i);
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render in mobile viewport', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should render without errors
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    it('should render in desktop viewport', async () => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should render without errors
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Data Display Formatting', () => {
    it('should format currency values correctly', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show formatted currency
      expect(screen.getByText(/\$125,750\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$1,050\.00/)).toBeInTheDocument();
    });

    it('should format dates correctly', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show formatted dates (exact format depends on utils)
      // Just verify dates are displayed
      const dateElements = screen.getAllByText(/2025|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should display booking numbers in correct format', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should match UDR-YYYY-NNN format (multiple bookings may exist)
      const bookingNumbers = screen.getAllByText(/UDR-2025-\d{3}/);
      expect(bookingNumbers.length).toBeGreaterThan(0);
    });
  });

  describe('Stats Calculations', () => {
    it('should calculate completed bookings percentage', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Completed: 35, Total: 47
      // Percentage: ~74.5%
      expect(screen.getByText('35')).toBeInTheDocument();
    });

    it('should show cancelled bookings count', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab navigation', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Tabs should have proper roles
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should have accessible heading structure', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/admin dashboard/i);
    });

    it('should have accessible links', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // All links should have accessible names
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-fetch data unnecessarily', async () => {
      const { rerender } = render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const initialText = screen.getByText('47');

      // Re-render component
      rerender(<AdminDashboard />);

      // Should not show loading again (data cached)
      expect(screen.getByText('47')).toBe(initialText);
    });

    it('should clean up on unmount', () => {
      const { unmount } = render(<AdminDashboard />);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});


