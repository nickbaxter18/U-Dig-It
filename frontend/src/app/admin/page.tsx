'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface ProfileApiResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export default function AdminPage() {
  const { user, role, loading: isLoading } = useAuth();
  const [profileApiResponse, setProfileApiResponse] = useState<ProfileApiResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth('/api/auth/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileApiResponse(data);
        } else {
          const errorData = await response.json();
          setApiError(`API Error: ${errorData.message}`);
        }
      } catch (error) {
        setApiError(`Fetch Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">useAuth Hook Data</h2>
          <p>
            <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
          </p>
          <p>
            <strong>Loading:</strong> {isLoading.toString()}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Profile API Response</h2>
          {profileApiResponse ? (
            <pre className="overflow-auto rounded-md bg-gray-50 p-4 text-sm">
              {JSON.stringify(profileApiResponse, null, 2)}
            </pre>
          ) : apiError ? (
            <p className="text-red-600">
              <strong>Error:</strong> {apiError}
            </p>
          ) : (
            <p>Fetching API response...</p>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">Admin Access Test</h2>
        {role === 'admin' || role === 'super_admin' ? (
          <p className="text-xl text-green-600">✅ Admin Access Granted!</p>
        ) : (
          <p className="text-xl text-red-600">❌ Admin Access Denied</p>
        )}
        <p>User role: {role || user?.user_metadata?.role || 'none'}</p>
      </div>

      <div className="flex space-x-4">
        <Link href="/" className="rounded-md bg-gray-300 px-6 py-3 text-gray-800 hover:bg-gray-400">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
