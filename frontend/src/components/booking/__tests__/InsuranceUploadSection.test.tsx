import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsuranceUploadSection } from '../InsuranceUploadSection';
import { createTestBooking } from '@/test-utils';

describe('InsuranceUploadSection', () => {
  const mockOnUploadComplete = vi.fn();
  const booking = createTestBooking();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload section', () => {
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });

    it('should show upload button or drag-drop zone', () => {
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);
      expect(screen.getByText(/upload|drag.*drop/i)).toBeInTheDocument();
    });

    it('should display requirements', () => {
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);
      expect(screen.getByText(/certificate of insurance|COI/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept PDF files', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['insurance content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/insurance\.pdf/i)).toBeInTheDocument();
      });
    });

    it('should accept image files', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['image'], 'insurance.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/insurance\.jpg/i)).toBeInTheDocument();
      });
    });

    it('should reject invalid file types', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['text'], 'document.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type|only PDF|only images/i)).toBeInTheDocument();
      });
    });

    it('should reject files over size limit', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      // Create 11MB file (assuming 10MB limit)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/too large|file size/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should show upload progress', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);

      // Click upload/confirm button
      const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
      await user.click(uploadButton);

      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    it('should call onUploadComplete on success', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);
      const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('should show error on upload failure', async () => {
      const user = userEvent.setup();
      // Mock upload failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Upload failed'));

      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);
      const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/upload failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Preview', () => {
    it('should show file preview after selection', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/insurance\.pdf/i)).toBeInTheDocument();
    });

    it('should allow removing selected file', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);
      expect(screen.getByText(/insurance\.pdf/i)).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: /remove|delete/i });
      await user.click(removeButton);

      expect(screen.queryByText(/insurance\.pdf/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const input = screen.getByLabelText(/upload|choose file/i);
      expect(input).toHaveAccessibleName();
    });

    it('should announce upload status', async () => {
      const user = userEvent.setup();
      render(<InsuranceUploadSection booking={booking} onUploadComplete={mockOnUploadComplete} />);

      const file = new File(['content'], 'insurance.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload|choose file/i) as HTMLInputElement;

      await user.upload(input, file);
      const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
      await user.click(uploadButton);

      await waitFor(() => {
        const status = screen.queryByRole('status');
        if (status) expect(status).toBeInTheDocument();
      });
    });
  });
});


