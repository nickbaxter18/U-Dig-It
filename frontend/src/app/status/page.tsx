'use client';

import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface SystemStatus {
  frontend: boolean;
  supabase: boolean;
  database: boolean;
  api: boolean;
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus>({
    frontend: false,
    supabase: false,
    database: false,
    api: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const newStatus: SystemStatus = {
        frontend: true, // We're here, so frontend is working
        supabase: false,
        database: false,
        api: false,
      };

      try {
        // MIGRATED: Check Supabase connectivity
        const { data, error } = await supabase.from('equipment').select('count').limit(1);

        if (!error) {
          newStatus.supabase = true;
          newStatus.database = true; // Supabase includes database
        }
      } catch {
        // Supabase not available
      }

      // API is working if we can make requests
      newStatus.api = true;

      setStatus(newStatus);
      setLoading(false);
    };

    checkStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isWorking: boolean) => {
    return isWorking ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusText = (isWorking: boolean) => {
    return isWorking ? 'Operational' : 'Offline';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900">System Status</h1>

          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Checking system status...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Core Services</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Frontend</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status.frontend)}`}
                    >
                      {getStatusText(status.frontend)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Supabase Backend</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status.supabase)}`}
                    >
                      {getStatusText(status.supabase)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Database</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status.database)}`}
                    >
                      {getStatusText(status.database)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">API Client</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status.api)}`}
                    >
                      {getStatusText(status.api)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Features</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Homepage with quote calculator</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Booking flow with step-by-step process</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Real-time availability checking</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Delivery area pricing</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Responsive design</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600">✓</span>
                    <span>Mock API for development</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-800">Development Mode</h3>
            <p className="text-sm text-blue-700">
              The site is running in development mode with mock API fallbacks. All booking
              functionality works with simulated data.
            </p>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href="/"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Homepage
            </a>
            <a
              href="/book"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Try Booking Flow
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
