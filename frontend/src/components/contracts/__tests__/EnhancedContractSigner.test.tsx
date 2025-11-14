import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnhancedContractSigner from '../EnhancedContractSigner';
import { createTestBooking } from '@/test-utils';

describe('EnhancedContractSigner', () => {
  const mockOnSigned = vi.fn();
  const mockOnError = vi.fn();
  const booking = createTestBooking();

  const bookingData = {
    bookingNumber: booking.bookingNumber,
    equipmentModel: 'Kubota SVL-75',
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmount: booking.totalAmount,
    deliveryAddress: booking.deliveryAddress,
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '(506) 555-0100',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render contract preview', () => {
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    expect(screen.getByText(/rental agreement/i)).toBeInTheDocument();
  });

  it('should display booking information in contract', () => {
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    expect(screen.getByText(bookingData.bookingNumber)).toBeInTheDocument();
    expect(screen.getByText(/kubota svl-75/i)).toBeInTheDocument();
  });

  it('should have signature options', () => {
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    expect(screen.getByRole('button', { name: /draw.*signature/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /type.*signature/i })).toBeInTheDocument();
  });

  it('should require acceptance checkbox before signing', async () => {
    const user = userEvent.setup();
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    const signButton = screen.getByRole('button', { name: /sign contract.*confirm booking/i });
    expect(signButton).toBeDisabled();

    const checkbox = screen.getByRole('checkbox', { name: /agree|accept|consent/i });
    await user.click(checkbox);

    await waitFor(() => {
      expect(signButton).not.toBeDisabled();
    });
  });

  it('should allow drawing signature', async () => {
    const user = userEvent.setup();
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    const drawButton = screen.getByRole('button', { name: /✍.*draw/i });
    await user.click(drawButton);

    // Should show canvas or drawing area
    await waitFor(() => {
      expect(screen.getByText(/draw.*signature|signature.*pad/i)).toBeInTheDocument();
    });
  });

  it('should allow typing signature', async () => {
    const user = userEvent.setup();
    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    const typeButton = screen.getByRole('button', { name: /⌨.*type/i });
    await user.click(typeButton);

    // Should show text input
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /type.*name/i })).toBeInTheDocument();
    });
  });

  it('should handle signing errors', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error('Signing failed'));

    render(<EnhancedContractSigner bookingId={booking.id} bookingData={bookingData} onSigned={mockOnSigned} onError={mockOnError} />);

    const checkbox = screen.getByRole('checkbox', { name: /agree|accept|consent/i });
    await user.click(checkbox);

    const signButton = screen.getByRole('button', { name: /sign contract.*confirm booking/i });
    await user.click(signButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('fail'));
    });
  });
});


