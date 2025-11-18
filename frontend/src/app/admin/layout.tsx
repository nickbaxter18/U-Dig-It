'use client';

import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminToastProvider } from '@/components/admin/AdminToastProvider';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { AdminQueryClientProvider } from '@/lib/react-query/query-client';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Check if user is admin or super_admin
      const isAdmin = role === 'admin' || role === 'super_admin';

      if (!isAdmin) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Not admin, redirecting to homepage', {
            component: 'app-layout',
            action: 'debug',
          });
        }
        router.push('/admin-login');
      }
    }
  }, [user, role, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
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
          <button
            onClick={() => router.push('/admin-login')}
            className="bg-kubota-orange rounded-md px-4 py-2 text-white hover:bg-orange-600"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminQueryClientProvider>
      <AdminToastProvider>
        <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Breadcrumb */}
          <AdminBreadcrumb />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      </AdminToastProvider>
    </AdminQueryClientProvider>
  );
}
