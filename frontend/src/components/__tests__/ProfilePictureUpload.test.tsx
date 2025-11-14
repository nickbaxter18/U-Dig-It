import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePictureUpload from '../ProfilePictureUpload';

describe('ProfilePictureUpload', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render upload button', () => {
    render(<ProfilePictureUpload currentImageUrl={null} onUpload={mockOnUpload} />);
    expect(screen.getByRole('button', { name: /upload|change.*picture/i })).toBeInTheDocument();
  });

  it('should display current profile picture', () => {
    render(<ProfilePictureUpload currentImageUrl="https://example.com/avatar.jpg" onUpload={mockOnUpload} />);
    expect(screen.getByRole('img', { name: /profile/i })).toBeInTheDocument();
  });

  it('should accept image files', async () => {
    const user = userEvent.setup();
    render(<ProfilePictureUpload currentImageUrl={null} onUpload={mockOnUpload} />);

    const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload.*picture/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
    });
  });

  it('should reject non-image files', async () => {
    const user = userEvent.setup();
    render(<ProfilePictureUpload currentImageUrl={null} onUpload={mockOnUpload} />);

    const file = new File(['text'], 'document.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/only.*images|invalid.*type/i)).toBeInTheDocument();
    });
  });

  it('should show image preview', async () => {
    const user = userEvent.setup();
    render(<ProfilePictureUpload currentImageUrl={null} onUpload={mockOnUpload} />);

    const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /preview/i })).toBeInTheDocument();
    });
  });

  it('should crop image before upload', async () => {
    const user = userEvent.setup();
    render(<ProfilePictureUpload currentImageUrl={null} onUpload={mockOnUpload} enableCrop={true} />);

    const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/crop|adjust/i)).toBeInTheDocument();
    });
  });
});

