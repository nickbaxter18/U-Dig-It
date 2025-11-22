'use client';

import { ChevronLeft, ChevronRight, Home, Menu } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import NotificationCenter from '@/components/NotificationCenter';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { RealtimeConnectionIndicator } from './RealtimeConnectionIndicator';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  const userInitial =
    user?.user_metadata?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A';

  const userName = user?.user_metadata?.firstName || user?.email || 'Admin User';
  const userEmail = user?.email || '';
  const userRoleLabel = role === 'super_admin' ? 'Super Admin' : 'Admin';

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ name: string; href: string; current: boolean }> = [];

    // Skip the first "admin" segment and process the rest
    const relevantSegments = segments.slice(1); // Skip "admin"

    if (relevantSegments.length === 0) {
      // We're on /admin root, just show "Dashboard"
      breadcrumbs.push({
        name: 'Dashboard',
        href: '/admin',
        current: true,
      });
      return breadcrumbs;
    }

    // Build breadcrumbs from remaining segments
    let currentPath = '/admin';
    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === relevantSegments.length - 1;

      // Convert segment to readable name
      const name = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        name,
        href: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-[60] w-full relative bg-white transition-all duration-700 ease-out py-3 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2),0_8px_20px_-6px_rgba(0,0,0,0.15),0_2px_8px_-2px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.06)]">
      {/* Premium Glossy Shine Effect */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[60%] bg-gradient-to-b from-white/60 via-white/20 to-transparent opacity-100"></div>

      {/* Enhanced Depth Shadow - Bottom Inner */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-gray-300/50 via-gray-200/20 to-transparent"></div>

      {/* Premium Edge Glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-400/60 to-transparent opacity-100"></div>

      {/* Subtle Top Highlight for Extra Depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-100"></div>

      {/* Additional Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-gray-50/20 opacity-100"></div>

      <div className="relative z-10 flex h-20 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
        {/* Left side - Menu button, logo and title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo and brand section */}
          <div className="group flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 rounded-lg bg-gray-900 p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 md:h-11 md:w-11">
              <Image
                src="/images/udigit-logo.png"
                alt="U-Dig It Rentals Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden flex-col lg:flex">
              <h1 className="text-xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-brand-primary">
                Kubota Rental Platform
              </h1>
              <div className="flex items-center gap-2 text-sm">
                <p className="font-medium text-gray-600">Administration Dashboard</p>
                <span className="text-gray-400">•</span>
                {/* Breadcrumb integrated */}
                <ol className="flex items-center space-x-1.5">
                  <li>
                    <Link
                      href="/admin"
                      className="flex items-center text-gray-500 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded"
                    >
                      <Home className="h-3.5 w-3.5" />
                      <span className="sr-only">Admin</span>
                    </Link>
                  </li>
                  {breadcrumbs.map((breadcrumb) => (
                    <li key={breadcrumb.href} className="flex items-center">
                      <ChevronRight className="mx-1 h-3.5 w-3.5 text-gray-400" />
                      {breadcrumb.current ? (
                        <span className="font-semibold text-premium-gold transition-colors duration-200">
                          {breadcrumb.name}
                        </span>
                      ) : (
                        <Link
                          href={breadcrumb.href}
                          className="font-medium text-gray-600 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded"
                        >
                          {breadcrumb.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Connection indicator, Return button, Notifications and user menu */}
        <div className="flex items-center gap-3">
          {/* Real-time Connection Indicator */}
          <div className="hidden sm:block">
            <RealtimeConnectionIndicator />
          </div>

          {/* Return to Homepage button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-premium-gold hover:bg-premium-gold-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2"
            aria-label="Return to homepage"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Return to Homepage</span>
            <span className="sm:hidden">Home</span>
          </button>

          {/* Notifications */}
          <div className="hidden sm:block">
            <NotificationCenter userId={user?.id} showBadge={true} />
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rounded-lg p-1.5 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-premium-gold to-premium-gold-dark shadow-md ring-2 ring-white transition-transform duration-200 hover:scale-105">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={`${userName}'s profile picture`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-black">{userInitial}</span>
                )}
              </div>
            </button>

            {/* Dropdown menu with smooth animations */}
            {showUserMenu && (
              <div className="absolute right-0 z-50 mt-2 w-56 animate-fade-in rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm py-2 shadow-xl">
                {/* User info section */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{userEmail}</p>
                  {role && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-premium-gold-50 px-2 py-0.5">
                      <span className="text-xs font-medium text-premium-gold-dark">
                        {userRoleLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sign out button */}
                <button
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
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
