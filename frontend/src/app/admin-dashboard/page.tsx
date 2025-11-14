'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export default function AdminDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      // Debug information
      const debug = `User: ${JSON.stringify(user, null, 2)}, Loading: ${loading}`;
      setDebugInfo(debug);

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Admin Dashboard Debug', {
          component: 'app-page',
          action: 'debug',
          metadata: { debug },
        });
      }

      const isAdmin = role === 'admin' || role === 'super_admin';

      if (isAdmin) {
        // Redirect to the actual admin dashboard
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Redirecting to admin dashboard...', {
            component: 'app-page',
            action: 'debug',
          });
        }
        router.push('/admin/dashboard');
      } else {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('No admin access, redirecting to admin login...', {
            component: 'app-page',
            action: 'debug',
          });
        }
        router.push('/admin-login');
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="border-kubota-orange mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="max-w-2xl text-center">
        <div className="border-kubota-orange mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <p className="mb-4 text-gray-600">Redirecting to admin dashboard...</p>

        {/* Debug information */}
        <div className="rounded-lg bg-white p-4 text-left shadow-md">
          <h3 className="mb-2 text-sm font-medium text-gray-900">Debug Information:</h3>
          <pre className="whitespace-pre-wrap text-xs text-gray-600">{debugInfo}</pre>
        </div>

        <div className="mt-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-kubota-orange mr-2 rounded-md px-4 py-2 text-white hover:bg-orange-600"
          >
            Go to Admin Dashboard
          </button>
          <button
            onClick={() => router.push('/admin-login')}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
