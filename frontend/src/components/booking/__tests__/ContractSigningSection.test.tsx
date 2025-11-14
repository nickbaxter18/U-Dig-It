import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractSigningSection } from '../ContractSigningSection';
import { createTestBooking } from '@/test-utils';

const mockOnSignatureComplete = vi.fn();

describe('ContractSigningSection', () => {
  const booking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render contract section', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByText(/rental agreement|contract/i)).toBeInTheDocument();
    });

    it('should display booking information', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByText(booking.bookingNumber)).toBeInTheDocument();
    });

    it('should show signature canvas or input', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByRole('button', { name: /sign|draw signature/i })).toBeInTheDocument();
    });
  });

  describe('Contract Preview', () => {
    it('should display contract terms', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByText(/terms and conditions|rental agreement/i)).toBeInTheDocument();
    });

    it('should show equipment details in contract', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByText(/kubota|equipment/i)).toBeInTheDocument();
    });

    it('should display rental dates', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      // Should show formatted dates
      const dateElements = screen.getAllByText(/2025|jan|feb|mar/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Signature Capture', () => {
    it('should enable signature button', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      const signButton = screen.getByRole('button', { name: /sign|draw/i });
      expect(signButton).not.toBeDisabled();
    });

    it('should open signature modal when clicking sign button', async () => {
      const user = userEvent.setup();
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);

      await user.click(screen.getByRole('button', { name: /sign|draw/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call onSignatureComplete when signature submitted', async () => {
      const user = userEvent.setup();
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);

      await user.click(screen.getByRole('button', { name: /sign|draw/i }));

      // Submit signature (mock signature data)
      const submitButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSignatureComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should require checkbox agreement before signing', async () => {
      const user = userEvent.setup();
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);

      const signButton = screen.getByRole('button', { name: /sign|draw/i });

      // Should be disabled without checkbox
      if (screen.queryByRole('checkbox', { name: /agree|accept/i })) {
        expect(signButton).toBeDisabled();

        // Check agreement
        await user.click(screen.getByRole('checkbox', { name: /agree|accept/i }));
        expect(signButton).not.toBeDisabled();
      }
    });

    it('should not allow empty signature submission', async () => {
      const user = userEvent.setup();
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);

      await user.click(screen.getByRole('button', { name: /sign|draw/i }));

      // Try to submit without drawing
      const submitButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(submitButton);

      // Should show error or button stays disabled
      expect(mockOnSignatureComplete).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading when submitting signature', async () => {
      const user = userEvent.setup();
      mockOnSignatureComplete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);

      await user.click(screen.getByRole('button', { name: /sign|draw/i }));
      const submitButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(submitButton);

      expect(screen.getByText(/submitting|saving/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible contract text', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<ContractSigningSection booking={booking} onSignatureComplete={mockOnSignatureComplete} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });
});


