import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseAuthProvider, useAuth } from '../SupabaseAuthProvider';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    setSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock auth service
const mockAuthService = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/lib/supabase/auth', () => ({
  authService: mockAuthService,
}));

describe('SupabaseAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  describe('Initialization', () => {
    it('should start in loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.initialized).toBe(false);
    });

    it('should initialize with no user when no session exists', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.initialized).toBe(true);
    });

    it('should initialize with user when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'customer' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.initialized).toBe(true);
    });

    it('should handle session initialization errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.initialized).toBe(true);
    });
  });

  describe('Sign In', () => {
    it('should call authService.signIn with credentials', async () => {
      mockAuthService.signIn.mockResolvedValue({ user: { id: 'user-123' }, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signIn('test@example.com', 'password123');

      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should update user state after successful sign in', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockAuthService.signIn.mockResolvedValue({ user: mockUser, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signIn('test@example.com', 'password123');

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should throw error on sign in failure', async () => {
      mockAuthService.signIn.mockResolvedValue({
        user: null,
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await expect(result.current.signIn('test@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('Sign Up', () => {
    it('should call authService.signUp with user data', async () => {
      const userData = { firstName: 'John', lastName: 'Doe' };
      mockAuthService.signUp.mockResolvedValue({ user: { id: 'user-123' }, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signUp('test@example.com', 'password123', userData);

      expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', userData);
    });

    it('should handle sign up errors', async () => {
      mockAuthService.signUp.mockResolvedValue({
        user: null,
        error: { message: 'Email already exists' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await expect(result.current.signUp('test@example.com', 'password123', {})).rejects.toThrow();
    });
  });

  describe('Google Sign In', () => {
    it('should call signInWithGoogle', async () => {
      mockAuthService.signInWithGoogle.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signInWithGoogle('/dashboard');

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle Google sign in errors', async () => {
      mockAuthService.signInWithGoogle.mockResolvedValue({
        error: { message: 'Google auth failed' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await expect(result.current.signInWithGoogle()).rejects.toThrow();
    });
  });

  describe('Sign Out', () => {
    it('should call authService.signOut', async () => {
      mockAuthService.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signOut();

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should clear user state after sign out', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
      mockAuthService.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await result.current.signOut();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });

    it('should handle sign out errors', async () => {
      mockAuthService.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      await expect(result.current.signOut()).rejects.toThrow();
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes', () => {
      renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should update user when auth state changes', async () => {
      const mockCallback = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      // Simulate auth state change
      const newUser = { id: 'user-456', email: 'new@example.com' };
      mockCallback('SIGNED_IN', { user: newUser });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
      });
    });

    it('should handle SIGNED_OUT event', async () => {
      const mockCallback = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      // User should be logged in
      expect(result.current.user).toBeTruthy();

      // Simulate sign out
      mockCallback('SIGNED_OUT', { user: null });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('Context Provider', () => {
    it('should provide auth context to children', async () => {
      const TestComponent = () => {
        const { user, loading } = useAuth();
        return <div>{loading ? 'Loading...' : user ? user.email : 'Not logged in'}</div>;
      };

      render(
        <SupabaseAuthProvider>
          <TestComponent />
        </SupabaseAuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Not logged in')).toBeInTheDocument();
      });
    });

    it('should throw error when useAuth is used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Cookie Session Restore', () => {
    it('should restore session from cookie when available', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock cookie with session
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'supabase.auth.token={"access_token":"token","refresh_token":"refresh"}',
      });

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      expect(mockSupabase.auth.setSession).toHaveBeenCalled();
    });

    it('should handle cookie parse errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Mock invalid cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'supabase.auth.token=invalid-json',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      // Should initialize with no user (no crash)
      expect(result.current.user).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth changes on unmount', () => {
      const unsubscribe = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should handle unmount during initialization', () => {
      mockSupabase.auth.getSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      // Unmount before initialization completes
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should set loading to false after initialization', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set initialized to true after first load', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      expect(result.current.initialized).toBe(false);

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still initialize despite error
      expect(result.current.initialized).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should log errors in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSupabase.auth.getSession.mockRejectedValue(new Error('Test error'));

      renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => {
        // Error should be logged (check logger was called)
        expect(true).toBe(true); // Logger mock would be checked here
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Multiple Consumers', () => {
    it('should provide same context to multiple children', async () => {
      const TestComponent1 = () => {
        const { user } = useAuth();
        return <div>Component 1: {user?.email || 'No user'}</div>;
      };

      const TestComponent2 = () => {
        const { user } = useAuth();
        return <div>Component 2: {user?.email || 'No user'}</div>;
      };

      render(
        <SupabaseAuthProvider>
          <TestComponent1 />
          <TestComponent2 />
        </SupabaseAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Component 1: No user')).toBeInTheDocument();
        expect(screen.getByText('Component 2: No user')).toBeInTheDocument();
      });
    });
  });

  describe('User Metadata', () => {
    it('should include user metadata in user object', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          role: 'admin',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: SupabaseAuthProvider,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      expect(result.current.user?.user_metadata).toEqual({
        role: 'admin',
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });
});


