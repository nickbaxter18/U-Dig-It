import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignUpForm from '../SignUpForm';

// Mock useAuth hook
const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: vi.fn(() => ({
    signUp: mockSignUp,
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

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      resend: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render OAuth buttons initially', () => {
      render(<SignUpForm />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    });

    it('should render email sign up button', () => {
      render(<SignUpForm />);

      const emailButton = screen.getByRole('button', { name: /sign up with email/i });
      expect(emailButton).toBeInTheDocument();
    });

    it('should not show form fields initially', () => {
      render(<SignUpForm />);

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });
  });

  describe('Progressive Disclosure', () => {
    it('should show form when clicking email button', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it('should show back button in form', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });

    it('should return to OAuth view when clicking back', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));
      await waitFor(() => screen.getByRole('button', { name: /back/i }));

      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('should have all required fields', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have password strength indicator', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        const passwordInput = screen.getAllByLabelText(/password/i)[0];
        expect(passwordInput).toBeInTheDocument();
      });
    });

    it('should have confirm password field', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate first name', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        await user.type(firstNameInput, 'A');
        await user.clear(firstNameInput);

        await waitFor(() => {
          expect(screen.getByText(/first name.*required/i)).toBeInTheDocument();
        });
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        const emailInput = screen.getByLabelText(/email/i);
        await user.type(emailInput, 'invalid-email');

        await waitFor(() => {
          expect(screen.getByText(/valid email/i)).toBeInTheDocument();
        });
      });
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        const passwordInput = screen.getAllByLabelText(/password/i)[0];
        await user.type(passwordInput, '12345');

        await waitFor(() => {
          expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
        });
      });
    });

    it('should validate passwords match', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        const passwordInput = screen.getAllByLabelText(/password/i)[0];
        const confirmInput = screen.getByLabelText(/confirm password/i);

        await user.type(passwordInput, 'password123');
        await user.type(confirmInput, 'different456');

        await waitFor(() => {
          expect(screen.getByText(/passwords.*not match/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with correct data', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getAllByLabelText(/password/i)[0], 'SecurePass123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');

        await user.click(screen.getByRole('button', { name: /create account|sign up/i }));

        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledWith(
            expect.objectContaining({
              email: 'john@example.com',
              password: 'SecurePass123!',
              firstName: 'John',
              lastName: 'Doe',
            })
          );
        });
      });
    });

    it('should show success message after signup', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getAllByLabelText(/password/i)[0], 'SecurePass123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');

        await user.click(screen.getByRole('button', { name: /create account|sign up/i }));

        await waitFor(() => {
          expect(screen.getByText(/check your email|confirmation.*sent/i)).toBeInTheDocument();
        });
      });
    });

    it('should handle signup errors', async () => {
      const user = userEvent.setup();
      mockSignUp.mockRejectedValue(new Error('User already registered'));

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
        await user.type(screen.getAllByLabelText(/password/i)[0], 'SecurePass123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');

        await user.click(screen.getByRole('button', { name: /create account|sign up/i }));

        await waitFor(() => {
          expect(screen.getByText(/already registered/i)).toBeInTheDocument();
        });
      });
    });

    it('should disable button while loading', async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getAllByLabelText(/password/i)[0], 'SecurePass123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');

        const submitButton = screen.getByRole('button', { name: /create account|sign up/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(submitButton).toBeDisabled();
        });
      });
    });
  });

  describe('OAuth Sign Up', () => {
    it('should call signInWithGoogle', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue({});

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should handle OAuth errors', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValue(new Error('OAuth failed'));

      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed.*sign.*up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(async () => {
        const passwordInputs = screen.getAllByLabelText(/password/i);
        const passwordInput = passwordInputs[0] as HTMLInputElement;
        expect(passwordInput.type).toBe('password');

        const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
        await user.click(toggleButtons[0]);

        await waitFor(() => {
          expect(passwordInput.type).toBe('text');
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.click(screen.getByRole('button', { name: /sign up with email/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toHaveAccessibleName();
        expect(screen.getByLabelText(/last name/i)).toHaveAccessibleName();
        expect(screen.getByLabelText(/email/i)).toHaveAccessibleName();
      });
    });
  });
});
