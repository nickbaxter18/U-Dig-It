'use client';

import { Menu } from 'lucide-react';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import NotificationCenter from '@/components/NotificationCenter';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { RealtimeConnectionIndicator } from './RealtimeConnectionIndicator';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Menu button and title */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-4 hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">Kubota Rental Platform</h1>
            <p className="text-sm text-gray-500">Administration Dashboard</p>
          </div>
        </div>

        {/* Right side - Return to homepage, Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Real-time Connection Indicator */}
          <RealtimeConnectionIndicator />

          {/* Return to Homepage button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="hidden sm:inline">Return to Homepage</span>
            <span className="sm:hidden">Home</span>
          </button>

          {/* Notifications */}
          <NotificationCenter userId={user?.id} showBadge={true} />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rounded-md p-2 hover:bg-gray-100"
              aria-label="User menu"
            >
              <div className="bg-kubota-orange flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-sm font-medium text-white">
                  {user?.user_metadata?.firstName?.charAt(0) ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    'A'}
                </span>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.firstName || user?.email || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
