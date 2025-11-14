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
    relevantSegments.forEach((segment: any, index: any) => {
      currentPath += `/${segment}`;
      const isLast = index === relevantSegments.length - 1;

      // Convert segment to readable name
      const name = segment
        .split('-')
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
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
    <nav className="border-b border-gray-200 bg-white px-6 py-3">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <Home className="h-4 w-4" />
            <span className="sr-only">Admin</span>
          </Link>
        </li>

        {breadcrumbs.map((breadcrumb: any, index: any) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            {breadcrumb.current ? (
              <span className="font-medium text-gray-900">{breadcrumb.name}</span>
            ) : (
              <Link href={breadcrumb.href} className="text-gray-500 hover:text-gray-700">
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
