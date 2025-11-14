'use client';

import UserDashboard from '@/components/UserDashboard';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Dashboard] Auth state', {
        component: 'app-page',
        action: 'debug',
        metadata: { user: !!user, loading, initialized },
      });
    }

    // CRITICAL: Only redirect if auth is fully initialized AND confirmed no user
    if (initialized && !loading && !user) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Dashboard] Fully initialized with no user, redirecting to sign-in', {
          component: 'app-page',
          action: 'debug',
        });
      }
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [user, loading, initialized, router]);

  // Always show loading while auth is being checked OR not initialized
  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, show loading while redirect happens
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // User is logged in, show dashboard
  return <UserDashboard />;
}
