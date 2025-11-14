import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsDashboard from '../AnalyticsDashboard';

// Mock child components
vi.mock('../admin/RevenueChart', () => ({
  RevenueChart: () => <div data-testid="revenue-chart">Revenue Chart</div>,
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render analytics dashboard', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });

  it('should display key metrics', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/revenue|bookings|customers/i)).toBeInTheDocument();
    });
  });

  it('should render revenue chart', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display date range selector', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /7 days|30 days/i })).toBeInTheDocument();
    });
  });
});

