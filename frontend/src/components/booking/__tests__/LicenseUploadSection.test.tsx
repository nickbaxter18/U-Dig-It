import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LicenseUploadSection } from '../LicenseUploadSection';

describe('LicenseUploadSection', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload section', () => {
    render(<LicenseUploadSection onComplete={mockOnComplete} />);
    expect(screen.getByText(/driver.*license|license/i)).toBeInTheDocument();
  });

  it('should accept image files', async () => {
    const user = userEvent.setup();
    render(<LicenseUploadSection onComplete={mockOnComplete} />);

    const file = new File(['license'], 'license.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload|choose/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/license\.jpg/i)).toBeInTheDocument();
    });
  });

  it('should reject non-image files', async () => {
    const user = userEvent.setup();
    render(<LicenseUploadSection onComplete={mockOnComplete} />);

    const file = new File(['text'], 'document.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload|choose/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*type|images only/i)).toBeInTheDocument();
    });
  });

  it('should show upload progress', async () => {
    const user = userEvent.setup();
    render(<LicenseUploadSection onComplete={mockOnComplete} />);

    const file = new File(['license'], 'license.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload|choose/i) as HTMLInputElement;

    await user.upload(input, file);
    const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
    await user.click(uploadButton);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
  });

  it('should call onComplete when upload succeeds', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ url: 'uploaded.jpg' }) });

    render(<LicenseUploadSection onComplete={mockOnComplete} />);

    const file = new File(['license'], 'license.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload|choose/i) as HTMLInputElement;

    await user.upload(input, file);
    const uploadButton = screen.getByRole('button', { name: /upload|confirm/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});


