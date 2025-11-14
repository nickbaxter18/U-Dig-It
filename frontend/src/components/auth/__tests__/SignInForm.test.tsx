/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignInForm from '../SignInForm';

// Mock useAuth hook
const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: vi.fn(() => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    loading: false,
    initialized: true,
  })),
}));

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render OAuth buttons initially', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    });

    it('should render email sign in button', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
    });

    it('should not show email form initially', () => {
      render(<SignInForm />);

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('Progressive Disclosure', () => {
    it('should show email form when clicking email button', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it('should show back button in email form', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });
  });

  describe('Email Form Elements', () => {
    it('should have email and password inputs', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        expect(emailInput).toHaveAttribute('type', 'email');
        expect(emailInput).toHaveAttribute('required');
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('required');
      });
    });

    it('should have submit button', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /^sign in$/i });
        expect(submitButton).toHaveAttribute('type', 'submit');
      });
    });

    it('should have forgot password link', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        const forgotLink = screen.getByRole('link', { name: /forgot password/i });
        expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
      });
    });

    it('should have remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);

      render(<SignInForm />);

      // Show email form
      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      // Fill form
      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(submitButton);

      // Verify
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should redirect to dashboard on success', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error message on failure', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpass');

      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Sign In', () => {
    it('should call signInWithGoogle when clicking Google button', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue(undefined);

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should show error on OAuth failure', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue(new Error('OAuth failed'));

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const passwordInput = await screen.findByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });

      await user.click(screen.getByRole('button', { name: /hide password/i }));

      await waitFor(() => {
        expect(passwordInput.type).toBe('password');
      });
    });
  });

  describe('Remember Me', () => {
    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const checkbox = await screen.findByRole('checkbox', { name: /remember me/i });
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Error Messages', () => {
    it('should show email not confirmed error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('Email not confirmed'));

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/confirm your email/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for other failures', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to sign in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Redirect', () => {
    it('should redirect to custom path', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);

      render(<SignInForm redirectTo="/book" />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email/i);
      const passwordInput = await screen.findByLabelText(/password/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/book');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const emailInput = await screen.findByLabelText(/email address/i);
      const passwordInput = await screen.findByLabelText(/^password$/i);

      expect(emailInput).toHaveAccessibleName();
      expect(passwordInput).toHaveAccessibleName();
    });

    it('should have accessible password toggle', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.click(screen.getByRole('button', { name: /sign in with email/i }));

      const toggleButton = await screen.findByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });
});
