import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../providers/ProtectedRoute';

const mockPush = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/protected-page',
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated Users', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('should not redirect when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated Users', () => {
    it('should redirect to sign-in when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin');
      });
    });

    it('should not render children when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initialized: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should not show children while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initialized: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should not redirect while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initialized: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', user_metadata: { role: 'admin' } },
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute requiredRole="admin">
          <div>Admin content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });

    it('should redirect when user lacks required role', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', user_metadata: { role: 'customer' } },
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute requiredRole="admin">
          <div>Admin content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Custom Redirect', () => {
    it('should redirect to custom URL when specified', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initialized: true,
      });

      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login');
      });
    });
  });
});


