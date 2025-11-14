import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('Visibility', () => {
    it('should render when visible prop is true', () => {
      render(<LoadingOverlay visible={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when visible prop is false', () => {
      const { container } = render(<LoadingOverlay visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render loading spinner when visible', () => {
      render(<LoadingOverlay visible={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display custom message', () => {
      render(<LoadingOverlay visible={true} message="Processing payment..." />);
      expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    });

    it('should display default message when not provided', () => {
      render(<LoadingOverlay visible={true} />);
      expect(screen.getByText(/loading|please wait/i)).toBeInTheDocument();
    });
  });

  describe('Overlay Behavior', () => {
    it('should block interaction with background', () => {
      const { container } = render(<LoadingOverlay visible={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('should have semi-transparent background', () => {
      const { container } = render(<LoadingOverlay visible={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(<LoadingOverlay visible={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(<LoadingOverlay visible={true} />);
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible description', () => {
      render(<LoadingOverlay visible={true} message="Uploading files..." />);
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-describedby');
    });
  });

  describe('Z-index Layering', () => {
    it('should have high z-index to cover content', () => {
      const { container } = render(<LoadingOverlay visible={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('z-50');
    });
  });
});


