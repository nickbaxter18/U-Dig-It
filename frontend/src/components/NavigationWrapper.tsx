'use client';

import { useEffect, useState } from 'react';
import Navigation from './Navigation';

export default function NavigationWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a skeleton that matches the Navigation structure during SSR
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
            <div className="hidden items-center space-x-8 md:flex">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return <Navigation />;
}
