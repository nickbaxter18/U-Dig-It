import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RentalDurationSelector from '../RentalDurationSelector';

describe('RentalDurationSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render start date picker', () => {
    render(<RentalDurationSelector onChange={mockOnChange} />);
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('should render end date picker', () => {
    render(<RentalDurationSelector onChange={mockOnChange} />);
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('should calculate rental days', async () => {
    const user = userEvent.setup();
    render(<RentalDurationSelector onChange={mockOnChange} />);

    const startDate = screen.getByLabelText(/start date/i);
    const endDate = screen.getByLabelText(/end date/i);

    await user.type(startDate, '2025-02-01');
    await user.type(endDate, '2025-02-05');

    expect(screen.getByText(/4 days/i)).toBeInTheDocument();
  });

  it('should call onChange with dates', async () => {
    const user = userEvent.setup();
    render(<RentalDurationSelector onChange={mockOnChange} />);

    await user.type(screen.getByLabelText(/start date/i), '2025-02-01');
    await user.type(screen.getByLabelText(/end date/i), '2025-02-05');

    expect(mockOnChange).toHaveBeenCalledWith({
      startDate: expect.any(String),
      endDate: expect.any(String),
      days: 4,
    });
  });

  it('should validate end date is after start date', async () => {
    const user = userEvent.setup();
    render(<RentalDurationSelector onChange={mockOnChange} />);

    await user.type(screen.getByLabelText(/start date/i), '2025-02-05');
    await user.type(screen.getByLabelText(/end date/i), '2025-02-01');

    expect(screen.getByText(/end date.*after.*start/i)).toBeInTheDocument();
  });

  it('should enforce minimum rental period', async () => {
    const user = userEvent.setup();
    render(<RentalDurationSelector onChange={mockOnChange} minDays={2} />);

    await user.type(screen.getByLabelText(/start date/i), '2025-02-01');
    await user.type(screen.getByLabelText(/end date/i), '2025-02-01');

    expect(screen.getByText(/minimum.*2 days/i)).toBeInTheDocument();
  });
});

