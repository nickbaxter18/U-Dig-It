import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscountCodeInput from '../DiscountCodeInput';

describe('DiscountCodeInput', () => {
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render discount code input', () => {
    render(<DiscountCodeInput onApply={mockOnApply} />);
    expect(screen.getByLabelText(/discount|promo code/i)).toBeInTheDocument();
  });

  it('should have apply button', () => {
    render(<DiscountCodeInput onApply={mockOnApply} />);
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });

  it('should validate code on apply', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true, discount: 10 }),
    });

    render(<DiscountCodeInput onApply={mockOnApply} />);

    await user.type(screen.getByLabelText(/discount/i), 'SAVE10');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/discount-codes/validate'),
        expect.any(Object)
      );
    });
  });

  it('should show success message for valid code', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true, discount: 10 }),
    });

    render(<DiscountCodeInput onApply={mockOnApply} />);

    await user.type(screen.getByLabelText(/discount/i), 'SAVE10');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(screen.getByText(/applied|discount.*applied/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid code', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid code' }),
    });

    render(<DiscountCodeInput onApply={mockOnApply} />);

    await user.type(screen.getByLabelText(/discount/i), 'INVALID');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
    });
  });

  it('should call onApply with discount data', async () => {
    const user = userEvent.setup();
    const discountData = { code: 'SAVE10', amount: 10, type: 'percentage' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(discountData),
    });

    render(<DiscountCodeInput onApply={mockOnApply} />);

    await user.type(screen.getByLabelText(/discount/i), 'SAVE10');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith(discountData);
    });
  });
});


