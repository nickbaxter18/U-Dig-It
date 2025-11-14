import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefundModal } from '../RefundModal';

const fetchWithAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/fetchWithAuth', () => ({
  fetchWithAuth: fetchWithAuthMock,
}));

describe('RefundModal', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  const payment = {
    id: 'payment-123',
    bookingNumber: 'BK-1001',
    customerName: 'Test User',
    amount: 1000,
    stripePaymentIntentId: 'pi_test_123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchWithAuthMock.mockResolvedValue({
      ok: true,
      json: async () => ({ refundId: 're_test_123' }),
    });
  });

  const renderModal = () =>
    render(<RefundModal payment={payment} onClose={mockOnClose} onRefundComplete={mockOnComplete} />);

  it('renders dialog with payment details', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/process refund/i)).toBeInTheDocument();
    const amountRow = screen.getByText(/original amount/i).closest('div');
    expect(amountRow?.textContent).toMatch(/Original Amount:\s*\$?1000\.00/);
  });

  it('submits full refund when reason provided', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/refund reason/i), 'Customer request');
    await user.click(screen.getByRole('button', { name: /refund \$1000\.00/i }));

    await waitFor(() => {
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        '/api/admin/payments/refund',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    const [, requestInit] = fetchWithAuthMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body).toMatchObject({
      paymentId: payment.id,
      amount: 1000,
      reason: 'Customer request',
      stripePaymentIntentId: payment.stripePaymentIntentId,
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('keeps submit disabled until reason entered', () => {
    renderModal();

    const submitButton = screen.getByRole('button', { name: /refund \$1000\.00/i });
    expect(submitButton).toBeDisabled();
    expect(fetchWithAuthMock).not.toHaveBeenCalled();
  });

  it('validates refund amount upper bound', async () => {
    const user = userEvent.setup();
    renderModal();

    const amountInput = screen.getByLabelText(/refund amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '1500');
    await user.type(screen.getByLabelText(/refund reason/i), 'Adjustment');
    await user.click(screen.getByRole('button', { name: /refund \$1500\.00/i }));

    await waitFor(() => {
      expect(screen.getByText(/between \$0\.01 and \$1000\.00/i)).toBeInTheDocument();
    });

    expect(fetchWithAuthMock).not.toHaveBeenCalled();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('surfaces API errors from refund endpoint', async () => {
    fetchWithAuthMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Stripe declined' }),
    });

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/refund reason/i), 'Customer request');
    await user.click(screen.getByRole('button', { name: /refund \$1000\.00/i }));

    await waitFor(() => {
      expect(screen.getByText(/stripe declined/i)).toBeInTheDocument();
    });

    expect(mockOnComplete).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
