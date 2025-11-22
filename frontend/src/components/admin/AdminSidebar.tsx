'use client';

import {
  Activity,
  BarChart,
  Calendar,
  DollarSign,
  FileText,
  Headphones,
  Home,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Truck,
  Users,
  Wrench,
  X,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Equipment', href: '/admin/equipment', icon: Wrench },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Operations', href: '/admin/operations', icon: Truck },
  { name: 'Support', href: '/admin/support', icon: Headphones },
  { name: 'Insurance', href: '/admin/insurance', icon: Shield },
  { name: 'ID Verification', href: '/admin/security/id-verification', icon: ShieldCheck },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag },
  { name: 'Contracts', href: '/admin/contracts', icon: FileText },
  { name: 'Communications', href: '/admin/communications', icon: MessageSquare },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Audit Log', href: '/admin/audit', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform relative bg-white/95 backdrop-blur-sm transition-all duration-700 ease-out shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2),0_8px_20px_-6px_rgba(0,0,0,0.15),0_2px_8px_-2px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.06)] lg:static lg:inset-0 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
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

        <nav className="relative z-10 pt-4 px-3">
          {/* Mobile close button */}
          <div className="flex justify-end mb-4 lg:hidden">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'btn-premium-gold text-black'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } `}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'} `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
