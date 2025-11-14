import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AvailabilityCalendar from '../AvailabilityCalendar';

describe('AvailabilityCalendar', () => {
  const mockOnDateSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render calendar', () => {
    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should fetch availability on mount', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ available: [] }),
    });

    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/availability'),
        expect.any(Object)
      );
    });
  });

  it('should mark unavailable dates', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        unavailable: ['2025-02-01', '2025-02-02'],
      }),
    });

    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);

    await waitFor(() => {
      const unavailableDates = screen.getAllByRole('gridcell', { name: /unavailable/i });
      expect(unavailableDates.length).toBeGreaterThan(0);
    });
  });

  it('should allow selecting available dates', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ unavailable: [] }),
    });

    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);

    await waitFor(() => screen.getAllByRole('gridcell'));

    const availableDate = screen.getAllByRole('gridcell')[15]; // Mid-month date
    await user.click(availableDate);

    expect(mockOnDateSelect).toHaveBeenCalled();
  });

  it('should prevent selecting unavailable dates', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ unavailable: ['2025-02-15'] }),
    });

    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);

    await waitFor(() => screen.getAllByRole('gridcell'));

    const unavailableDate = screen.getByRole('gridcell', { name: /15.*unavailable/i });
    await user.click(unavailableDate);

    expect(mockOnDateSelect).not.toHaveBeenCalled();
  });

  it('should navigate between months', async () => {
    const user = userEvent.setup();
    render(<AvailabilityCalendar equipmentId="eq-123" onDateSelect={mockOnDateSelect} />);

    const nextButton = screen.getByRole('button', { name: /next month/i });
    await user.click(nextButton);

    expect(screen.getByText(/march|mar/i)).toBeInTheDocument();
  });
});

