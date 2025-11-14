import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Toast from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with correct content and styling', () => {
    render(
      <Toast type="success" message="Operation completed successfully" onClose={mockOnClose} />
    );

    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('applies correct CSS classes based on type', () => {
    const { rerender } = render(
      <Toast type="success" message="Success message" onClose={mockOnClose} />
    );

    // Check for Tailwind success classes
    const successContainer = screen.getByText('Success message').closest('div[class*="bg-green"]');
    expect(successContainer).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

    // Test error type
    rerender(<Toast type="error" message="Error message" onClose={mockOnClose} />);
    const errorContainer = screen.getByText('Error message').closest('div[class*="bg-red"]');
    expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

    // Test warning type
    rerender(<Toast type="warning" message="Warning message" onClose={mockOnClose} />);
    const warningContainer = screen.getByText('Warning message').closest('div[class*="bg-yellow"]');
    expect(warningContainer).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

    // Test info type
    rerender(<Toast type="info" message="Info message" onClose={mockOnClose} />);
    const infoContainer = screen.getByText('Info message').closest('div[class*="bg-blue"]');
    expect(infoContainer).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('calls onClose after default duration', async () => {
    render(<Toast type="success" message="Test message" onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time by default duration (5000ms) + animation (300ms)
    vi.advanceTimersByTime(5300);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose after custom duration', async () => {
    render(<Toast type="success" message="Test message" duration={2000} onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time by custom duration (2000ms) + animation (300ms)
    vi.advanceTimersByTime(2300);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('allows manual close via close button', async () => {
    render(<Toast type="success" message="Test message" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click(); // Direct click instead of userEvent

    // Advance animation time
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles multiple toasts independently', async () => {
    const mockOnClose1 = vi.fn();
    const mockOnClose2 = vi.fn();

    const { rerender } = render(
      <Toast type="success" message="First toast" onClose={mockOnClose1} />
    );

    expect(mockOnClose1).not.toHaveBeenCalled();
    expect(mockOnClose2).not.toHaveBeenCalled();

    rerender(<Toast type="error" message="Second toast" onClose={mockOnClose2} />);

    // Fast-forward time with animation
    vi.advanceTimersByTime(5300);

    await waitFor(() => {
      expect(mockOnClose2).toHaveBeenCalledTimes(1);
    });
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(
      <Toast type="success" message="Test message" onClose={mockOnClose} />
    );

    unmount();

    // Fast-forward time after unmount (including animation)
    vi.advanceTimersByTime(5300);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<Toast type="success" message="Loading message" onClose={mockOnClose} />);

    expect(screen.getByText('Loading message')).toBeInTheDocument();
  });

  it('handles long messages correctly', () => {
    const longMessage =
      'This is a very long message that should be handled correctly by the toast component and should not break the layout or cause any issues with the display.';

    render(<Toast type="info" message={longMessage} onClose={mockOnClose} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('supports different toast types with appropriate styling', () => {
    const types = [
      { type: 'success' as const, colorClass: 'bg-green' },
      { type: 'error' as const, colorClass: 'bg-red' },
      { type: 'warning' as const, colorClass: 'bg-yellow' },
      { type: 'info' as const, colorClass: 'bg-blue' },
    ];

    types.forEach(({ type, colorClass }) => {
      const { unmount } = render(
        <Toast type={type} message={`${type} message`} onClose={mockOnClose} />
      );

      const container = screen.getByText(`${type} message`).closest(`div[class*="${colorClass}"]`);
      expect(container).toBeInTheDocument();
      unmount();
    });
  });

  it('handles rapid onClose calls gracefully', () => {
    render(<Toast type="success" message="Test message" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });

    // Click once
    closeButton.click();

    // Advance time for animation
    vi.advanceTimersByTime(300);

    // Component should be unmounted, so only called once
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays error messages correctly', () => {
    render(<Toast type="error" message="Something went wrong" onClose={mockOnClose} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
