import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentSection } from '../PaymentSection';
import { createTestBooking } from '@/test-utils';

const mockElements = vi.fn();
const mockCreatePaymentMethod = vi.fn();
const mockStripe = {
  elements: mockElements,
  createPaymentMethod: mockCreatePaymentMethod,
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Input</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

describe('PaymentSection', () => {
  const mockOnPaymentComplete = vi.fn();
  const booking = createTestBooking({ totalAmount: 1050 });

  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.mockReturnValue({
      getElement: vi.fn().mockReturnValue({}),
    });
  });

  describe('Rendering', () => {
    it('should render payment section', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    it('should display booking amount', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);
      expect(screen.getByText(/\$1,050/)).toBeInTheDocument();
    });

    it('should render Stripe card element', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);
      expect(screen.getByRole('button', { name: /pay now|submit payment/i })).toBeInTheDocument();
    });
  });

  describe('Payment Amount Display', () => {
    it('should show deposit amount if deposit required', () => {
      const bookingWithDeposit = createTestBooking({ totalAmount: 1000, depositAmount: 500 });
      render(<PaymentSection booking={bookingWithDeposit} onPaymentComplete={mockOnPaymentComplete} />);

      expect(screen.getByText(/\$500/)).toBeInTheDocument();
      expect(screen.getByText(/deposit/i)).toBeInTheDocument();
    });

    it('should format large amounts correctly', () => {
      const expensiveBooking = createTestBooking({ totalAmount: 12345.67 });
      render(<PaymentSection booking={expensiveBooking} onPaymentComplete={mockOnPaymentComplete} />);

      expect(screen.getByText(/\$12,345\.67/)).toBeInTheDocument();
    });

    it('should handle zero amount', () => {
      const freeBooking = createTestBooking({ totalAmount: 0 });
      render(<PaymentSection booking={freeBooking} onPaymentComplete={mockOnPaymentComplete} />);

      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });
  });

  describe('Payment Submission', () => {
    it('should show loading state when processing payment', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      const submitButton = screen.getByRole('button', { name: /pay now|submit/i });
      await user.click(submitButton);

      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should call onPaymentComplete on success', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_test123' },
        error: null,
      });

      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      const submitButton = screen.getByRole('button', { name: /pay now|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalled();
      });
    });

    it('should display error on payment failure', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: null,
        error: { message: 'Card declined' },
      });

      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      await user.click(screen.getByRole('button', { name: /pay now|submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/card declined/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockRejectedValue(new Error('Network error'));

      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      await user.click(screen.getByRole('button', { name: /pay now|submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    it('should display secure payment indicator', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);
      expect(screen.getByText(/secure|encrypted/i)).toBeInTheDocument();
    });

    it('should disable submit when Stripe not loaded', () => {
      vi.mocked(mockStripe).stripe = null;
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      const submitButton = screen.getByRole('button', { name: /pay now|submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      const submitButton = screen.getByRole('button', { name: /pay now|submit/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it('should announce payment status changes', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_test' },
        error: null,
      });

      render(<PaymentSection booking={booking} onPaymentComplete={mockOnPaymentComplete} />);

      await user.click(screen.getByRole('button', { name: /pay now|submit/i }));

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toBeInTheDocument();
      });
    });
  });
});


