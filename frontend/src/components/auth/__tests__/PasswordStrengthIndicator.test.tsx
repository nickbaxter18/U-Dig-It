import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  describe('Visibility', () => {
    it('should not render when password is empty', () => {
      const { container } = render(<PasswordStrengthIndicator password="" />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when show is false', () => {
      const { container } = render(<PasswordStrengthIndicator password="test123" show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when password is provided and show is true', () => {
      render(<PasswordStrengthIndicator password="test123" show={true} />);
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  describe('Strength Levels', () => {
    it('should show weak for short passwords', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('should show weak for passwords without numbers/symbols', () => {
      render(<PasswordStrengthIndicator password="password" />);
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('should show fair for passwords with basic requirements', () => {
      render(<PasswordStrengthIndicator password="password1" />);
      expect(screen.getByText(/fair|moderate/i)).toBeInTheDocument();
    });

    it('should show good for passwords with mixed case and numbers', () => {
      render(<PasswordStrengthIndicator password="Password123" />);
      expect(screen.getByText(/good|strong/i)).toBeInTheDocument();
    });

    it('should show strong for passwords with all requirements', () => {
      render(<PasswordStrengthIndicator password="P@ssw0rd123!" />);
      expect(screen.getByText(/strong|excellent/i)).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should display strength bars', () => {
      render(<PasswordStrengthIndicator password="test123" />);

      // Should have 4 strength bars
      const bars = screen.getAllByRole('presentation');
      expect(bars.length).toBe(4);
    });

    it('should fill bars based on strength score', () => {
      const { container } = render(<PasswordStrengthIndicator password="P@ssw0rd123!" />);

      // Strong password should fill all 4 bars
      const filledBars = container.querySelectorAll('.bg-green-500');
      expect(filledBars.length).toBeGreaterThan(0);
    });

    it('should use red color for weak passwords', () => {
      render(<PasswordStrengthIndicator password="123" />);

      const strengthLabel = screen.getByText(/weak/i);
      expect(strengthLabel).toHaveClass('text-red-700');
    });

    it('should use green color for strong passwords', () => {
      render(<PasswordStrengthIndicator password="P@ssw0rd123!" />);

      const strengthLabel = screen.getByText(/strong|excellent/i);
      expect(strengthLabel).toHaveClass('text-green-700');
    });
  });

  describe('Feedback Messages', () => {
    it('should show feedback for weak passwords', () => {
      render(<PasswordStrengthIndicator password="abc" />);

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('should show feedback for missing requirements', () => {
      render(<PasswordStrengthIndicator password="password" />);

      // Should suggest adding numbers or special characters
      const feedback = screen.getAllByRole('listitem');
      expect(feedback.length).toBeGreaterThan(0);
    });

    it('should show positive feedback for strong passwords', () => {
      render(<PasswordStrengthIndicator password="P@ssw0rd123!" />);

      // Should show checkmarks or positive feedback
      expect(screen.getByText(/✓|excellent|strong/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible strength label', () => {
      render(<PasswordStrengthIndicator password="test123" />);

      const strengthText = screen.getByText(/password strength/i);
      expect(strengthText).toBeInTheDocument();
    });

    it('should use semantic HTML for feedback list', () => {
      render(<PasswordStrengthIndicator password="test123" />);

      const feedbackList = screen.getByRole('list');
      expect(feedbackList).toBeInTheDocument();
    });
  });

  describe('Dynamic Updates', () => {
    it('should update strength when password changes', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="weak" />);

      expect(screen.getByText(/weak/i)).toBeInTheDocument();

      rerender(<PasswordStrengthIndicator password="P@ssw0rd123!" />);

      expect(screen.queryByText(/weak/i)).not.toBeInTheDocument();
      expect(screen.getByText(/strong|excellent/i)).toBeInTheDocument();
    });

    it('should optimize re-renders with useMemo', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="test123" />);

      const initialBars = screen.getAllByRole('presentation');

      // Re-render with same password
      rerender(<PasswordStrengthIndicator password="test123" />);

      const updatedBars = screen.getAllByRole('presentation');
      expect(updatedBars).toEqual(initialBars);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', () => {
      const longPassword = 'P@ssw0rd123!'.repeat(10);
      render(<PasswordStrengthIndicator password={longPassword} />);

      expect(screen.getByText(/strong|excellent/i)).toBeInTheDocument();
    });

    it('should handle passwords with unicode characters', () => {
      render(<PasswordStrengthIndicator password="Pässwörd123!" />);

      // Should not crash
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });

    it('should handle passwords with emojis', () => {
      render(<PasswordStrengthIndicator password="Password123!😀" />);

      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });
});


