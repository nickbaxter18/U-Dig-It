'use client';

import { ChevronRight, Home } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ name: string; href: string; current: boolean }> = [];

    // Skip the first "admin" segment and process the rest
    // For /admin/dashboard, we want just: Home > Dashboard
    // For /admin/bookings/123, we want: Home > Bookings > 123
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
    <nav className="relative border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_4px_-1px_rgba(0,0,0,0.06)] h-12">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/20 via-transparent to-gray-50/10 opacity-100"></div>

      {/* Premium Edge Glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-400/40 to-transparent opacity-100"></div>

      {/* Subtle Top Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-100"></div>

      <div className="relative z-10 flex h-12 items-center px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              href="/admin"
              className="flex items-center text-gray-500 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Admin</span>
            </Link>
          </li>

          {breadcrumbs.map((breadcrumb) => (
            <li key={breadcrumb.href} className="flex items-center">
              <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
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
    </nav>
  );
}
