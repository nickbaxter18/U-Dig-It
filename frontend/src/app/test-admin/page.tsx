'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useEffect, useState } from 'react';

export default function TestAdminPage() {
  const { user, loading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test the user data from Supabase
    if (user) {
      setProfileData({
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'user',
        status: user.user_metadata?.status || 'active',
        emailVerified: user.email_confirmed_at ? true : false,
        phoneVerified: user.phone_confirmed_at ? true : false,
        createdAt: user.created_at,
        lastLoginAt: user.last_sign_in_at,
      });
      setError(null);
    } else if (!loading) {
      setError('No user session found');
      setProfileData(null);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Admin Access Test</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Auth Hook Data */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">useAuth Hook Data</h2>
            <div className="space-y-2">
              <p>
                <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
              </p>
              <p>
                <strong>Loading:</strong> {loading ? 'true' : 'false'}
              </p>
            </div>
          </div>

          {/* Supabase User Data */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Supabase User Data</h2>
            {error ? (
              <div className="text-red-600">
                <p>
                  <strong>Error:</strong> {error}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong>Data:</strong>
                </p>
                <pre className="overflow-auto rounded bg-gray-100 p-2 text-sm">
                  {profileData ? JSON.stringify(profileData, null, 2) : 'Loading...'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Admin Access Test */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Admin Access Test</h2>
          {user?.role === 'admin' ? (
            <div className="text-green-600">
              <p className="text-lg font-semibold">✅ Admin Access Granted!</p>
              <p>User has admin role: {user.role}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="text-lg font-semibold">❌ Admin Access Denied</p>
              <p>User role: {user?.role || 'none'}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <a href="/admin" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Go to Admin Page
          </a>
          <a href="/" className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
