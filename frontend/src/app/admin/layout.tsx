'use client';

import { ReactNode, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AdminFooter } from '@/components/admin/AdminFooter';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminToastProvider } from '@/components/admin/AdminToastProvider';
import { ErrorBoundary } from '@/components/admin/ErrorBoundary';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { AdminQueryClientProvider } from '@/lib/react-query/query-client';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!loading) {
      // Check if user is admin or super_admin
      const isAdmin = role === 'admin' || role === 'super_admin';

      if (!isAdmin) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Not admin, redirecting to sign in', {
            component: 'app-layout',
            action: 'debug',
          });
        }
        // Redirect to sign in, which will handle authentication
        // If already signed in, user will see access denied message
        router.push('/auth/signin?redirect=/admin/settings&error=unauthorized');
      }
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    // Prevent body scroll on admin pages - only main content should scroll
    // Only apply when user is admin (after loading completes)
    if (!loading && (role === 'admin' || role === 'super_admin')) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [loading, role]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-premium-gold h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  // Check if user is admin or super_admin
  const isAdmin = role === 'admin' || role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mb-4 text-gray-600">You need admin privileges to access this page.</p>
          <p className="mb-4 text-sm text-gray-500">
            Admin access is managed through the Settings → Admins tab.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 rounded-md px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminQueryClientProvider>
      <AdminToastProvider>
        <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
          {/* Skip to main content link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Skip to main content
          </a>
          {/* Header - Full width at top */}
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Content area with sidebar and main */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Sidebar */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
              {/* Page content */}
              <main
                id="main-content"
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-h-0"
                role="main"
                aria-label="Dashboard content"
              >
                <ErrorBoundary>
                  <div className="mx-auto w-full max-w-7xl h-full">{children}</div>
                </ErrorBoundary>
              </main>

              {/* Footer */}
              <AdminFooter />
            </div>
          </div>
        </div>
      </AdminToastProvider>
    </AdminQueryClientProvider>
  );
}
