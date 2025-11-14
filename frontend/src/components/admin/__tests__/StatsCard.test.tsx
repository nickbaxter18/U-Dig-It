import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsCard } from '../StatsCard';

const MockIcon = ({ className }: { className?: string }) => (
  <svg data-testid="test-icon" className={className} />
);

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Bookings" value="47" icon={MockIcon} />);

    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    render(<StatsCard title="Revenue" value="$125,000" icon={MockIcon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('shows positive growth indicator', () => {
    render(
      <StatsCard
        title="Revenue"
        value="$1,000"
        icon={MockIcon}
        growth={12.5}
        growthType="positive"
      />
    );

    expect(screen.getByText('+12.5%')).toHaveClass('text-green-600');
  });

  it('shows negative growth indicator', () => {
    render(
      <StatsCard title="Revenue" value="$1,000" icon={MockIcon} growth={-4} growthType="negative" />
    );

    expect(screen.getByText('-4%')).toHaveClass('text-red-600');
  });

  it('does not render growth section when growth is zero', () => {
    render(<StatsCard title="Revenue" value="$1,000" icon={MockIcon} growth={0} />);
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it('supports numeric values', () => {
    render(<StatsCard title="Active Equipment" value={12} icon={MockIcon} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});



