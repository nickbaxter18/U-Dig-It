import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RevenueChart } from '../RevenueChart';

const mockData = [
  { date: '2025-01-01', revenue: 1200 },
  { date: '2025-01-02', revenue: 1800 },
  { date: '2025-01-03', revenue: 900 },
];

describe('RevenueChart', () => {
  it('should render chart container', () => {
    render(<RevenueChart loading={false} data={mockData} />);
    expect(screen.getByTestId('revenue-chart-container')).toBeInTheDocument();
  });

  it('should render bars for provided data', () => {
    render(<RevenueChart loading={false} data={mockData} />);
    expect(screen.getAllByTestId('revenue-bar')).toHaveLength(mockData.length);
  });

  it('should show loading state when loading', () => {
    render(<RevenueChart loading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<RevenueChart loading={false} data={[]} />);
    expect(screen.getByText(/no revenue data available/i)).toBeInTheDocument();
  });

  it('should render summary metrics from provided data', () => {
    render(<RevenueChart loading={false} data={mockData} dateRange="today" />);

    const summary = screen.getByTestId('revenue-summary');
    expect(within(summary).getAllByText('$3,900').length).toBeGreaterThan(0);
    expect(within(summary).getByText(/\+0.0%/)).toBeInTheDocument();
  });
});
