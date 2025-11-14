import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have loading text', () => {
      render(<LoadingSpinner text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should use default loading text when not provided', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should have sr-only text for screen readers', () => {
      render(<LoadingSpinner />);
      const srText = screen.getByText(/loading/i);
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Size Variants', () => {
    it('should render small spinner', () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('should render medium spinner by default', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('should render large spinner', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Color Variants', () => {
    it('should use primary color by default', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-kubota-orange');
    });

    it('should use white color when specified', () => {
      const { container } = render(<LoadingSpinner color="white" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-white');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should be marked as aria-live region', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });
  });
});


