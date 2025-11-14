import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestCheckout from '../GuestCheckout';

describe('GuestCheckout', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render guest checkout form', () => {
    render(<GuestCheckout onComplete={mockOnComplete} />);
    expect(screen.getByText(/guest checkout|continue as guest/i)).toBeInTheDocument();
  });

  it('should have email input', () => {
    render(<GuestCheckout onComplete={mockOnComplete} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should have name inputs', () => {
    render(<GuestCheckout onComplete={mockOnComplete} />);
    expect(screen.getByLabelText(/first.*name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last.*name/i)).toBeInTheDocument();
  });

  it('should have phone input', () => {
    render(<GuestCheckout onComplete={mockOnComplete} />);
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('should validate email', async () => {
    const user = userEvent.setup();
    render(<GuestCheckout onComplete={mockOnComplete} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid.*email/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<GuestCheckout onComplete={mockOnComplete} />);

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('should call onComplete with guest data', async () => {
    const user = userEvent.setup();
    render(<GuestCheckout onComplete={mockOnComplete} />);

    await user.type(screen.getByLabelText(/first.*name/i), 'John');
    await user.type(screen.getByLabelText(/last.*name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '5065550100');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        })
      );
    });
  });

  it('should show link to create account', () => {
    render(<GuestCheckout onComplete={mockOnComplete} />);
    expect(screen.getByRole('link', { name: /create.*account|sign up/i })).toBeInTheDocument();
  });
});

