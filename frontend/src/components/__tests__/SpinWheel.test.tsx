import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SpinWheel from '../SpinWheel';

describe('SpinWheel', () => {
  const mockOnWin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render spin wheel', () => {
    render(<SpinWheel onWin={mockOnWin} />);
    expect(screen.getByText(/spin to win|spin the wheel/i)).toBeInTheDocument();
  });

  it('should have spin button', () => {
    render(<SpinWheel onWin={mockOnWin} />);
    expect(screen.getByRole('button', { name: /spin/i })).toBeInTheDocument();
  });

  it('should disable spin button while spinning', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

    render(<SpinWheel onWin={mockOnWin} />);

    const spinButton = screen.getByRole('button', { name: /spin/i });
    await user.click(spinButton);

    expect(spinButton).toBeDisabled();
  });

  it('should call API to get spin result', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ prize: '10% off', segment: 2 }),
    });

    render(<SpinWheel onWin={mockOnWin} />);

    await user.click(screen.getByRole('button', { name: /spin/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/spin/roll'),
        expect.any(Object)
      );
    });
  });

  it('should display prize result', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ prize: '10% off', segment: 2 }),
    });

    render(<SpinWheel onWin={mockOnWin} />);

    await user.click(screen.getByRole('button', { name: /spin/i }));

    await waitFor(() => {
      expect(screen.getByText(/10% off/i)).toBeInTheDocument();
    });
  });

  it('should call onWin with prize data', async () => {
    const user = userEvent.setup();
    const prizeData = { prize: '10% off', code: 'SPIN10' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(prizeData),
    });

    render(<SpinWheel onWin={mockOnWin} />);

    await user.click(screen.getByRole('button', { name: /spin/i }));

    await waitFor(() => {
      expect(mockOnWin).toHaveBeenCalledWith(prizeData);
    });
  });

  it('should handle spin errors', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockRejectedValue(new Error('Spin failed'));

    render(<SpinWheel onWin={mockOnWin} />);

    await user.click(screen.getByRole('button', { name: /spin/i }));

    await waitFor(() => {
      expect(screen.getByText(/error|try again/i)).toBeInTheDocument();
    });
  });

  it('should prevent multiple spins', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Already spun' }),
    });

    render(<SpinWheel onWin={mockOnWin} />);

    await user.click(screen.getByRole('button', { name: /spin/i }));

    await waitFor(() => {
      expect(screen.getByText(/already.*spun|one spin/i)).toBeInTheDocument();
    });
  });
});

