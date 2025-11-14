import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TypedSignature } from '../TypedSignature';

describe('TypedSignature', () => {
  const mockOnSignatureComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render name input field', () => {
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);
    expect(screen.getByLabelText(/full name|name/i)).toBeInTheDocument();
  });

  it('should display typed signature preview', async () => {
    const user = userEvent.setup();
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    const input = screen.getByLabelText(/full name|name/i);
    await user.type(input, 'John Doe');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should render signature in cursive font', async () => {
    const user = userEvent.setup();
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');

    const preview = screen.getByText('John Doe');
    expect(preview).toHaveClass(/font-.*cursive|signature/);
  });

  it('should disable done button when name is empty', () => {
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    const doneButton = screen.getByRole('button', { name: /done|save/i });
    expect(doneButton).toBeDisabled();
  });

  it('should enable done button when name is entered', async () => {
    const user = userEvent.setup();
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');

    const doneButton = screen.getByRole('button', { name: /done|save/i });
    expect(doneButton).not.toBeDisabled();
  });

  it('should call onSignatureComplete with signature data', async () => {
    const user = userEvent.setup();
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.click(screen.getByRole('button', { name: /done|save/i }));

    expect(mockOnSignatureComplete).toHaveBeenCalledWith(expect.stringContaining('John Doe'));
  });

  it('should validate minimum name length', async () => {
    const user = userEvent.setup();
    render(<TypedSignature onSignatureComplete={mockOnSignatureComplete} />);

    await user.type(screen.getByLabelText(/full name/i), 'A');

    const doneButton = screen.getByRole('button', { name: /done|save/i });
    expect(doneButton).toBeDisabled();
  });
});


