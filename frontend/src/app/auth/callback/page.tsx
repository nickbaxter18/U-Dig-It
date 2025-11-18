import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

// Prevent static generation - this page must be rendered dynamically
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
