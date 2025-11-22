'use client';

import { HelpCircle, Info, Settings } from 'lucide-react';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
}

export function AdminFooter() {
  const { user, role } = useAuth();
  const [health, setHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
  });
  const [version] = useState('1.0.0');
  const currentYear = new Date().getFullYear();

  // Simple health check (non-blocking, cached)
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setHealth({
            database: 'healthy',
            api: data.status === 'healthy' ? 'healthy' : 'warning',
          });
        } else {
          setHealth({
            database: 'warning',
            api: 'warning',
          });
        }
      } catch {
        // Silent failure - don't block footer from rendering
        setHealth({
          database: 'warning',
          api: 'warning',
        });
      }
    };

    // Initial check
    checkHealth();

    // Refresh every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <footer className="relative border-t border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.12),0_-2px_6px_-2px_rgba(0,0,0,0.08)] h-16">
      {/* Premium Glossy Shine Effect (inverted for footer) */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[60%] bg-gradient-to-t from-white/60 via-white/20 to-transparent opacity-100"></div>

      {/* Enhanced Depth Shadow - Top Inner (inverted) */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-gray-300/50 via-gray-200/20 to-transparent"></div>

      {/* Premium Edge Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-400/60 to-transparent opacity-100"></div>

      {/* Subtle Bottom Highlight */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-100"></div>

      {/* Additional Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-50/30 via-transparent to-gray-50/20 opacity-100"></div>

      <div className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: System Status & Health */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Database Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${getStatusColor(health.database)} ${
                health.database === 'healthy' ? 'animate-pulse' : ''
              }`}
              title={`Database: ${health.database}`}
              aria-label={`Database status: ${health.database}`}
            ></div>
            <span className="hidden text-xs text-gray-600 sm:inline">Database</span>
          </div>

          {/* API Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${getStatusColor(health.api)} ${
                health.api === 'healthy' ? 'animate-pulse' : ''
              }`}
              title={`API: ${health.api}`}
              aria-label={`API status: ${health.api}`}
            ></div>
            <span className="hidden text-xs text-gray-600 sm:inline">API</span>
          </div>
        </div>

        {/* Center Section: Quick Links */}
        <div className="hidden items-center gap-3 text-xs text-gray-600 md:flex lg:gap-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-1 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded px-1"
            aria-label="Go to Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Settings</span>
          </Link>

          <Link
            href="/admin/audit"
            className="flex items-center gap-1 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded px-1"
            aria-label="Go to Audit Log"
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Audit Log</span>
          </Link>

          <Link
            href="/contact"
            className="flex items-center gap-1 transition-colors duration-200 hover:text-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 rounded px-1"
            aria-label="Get Help"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Help</span>
          </Link>
        </div>

        {/* Right Section: Version & Environment */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Copyright */}
          <div className="hidden text-xs text-gray-500 lg:block">
            <span>© {currentYear} U-Dig It Rentals</span>
          </div>

          {/* Version & Environment */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-gray-500 sm:inline">v{version}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isProduction ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}
              title={`Environment: ${process.env.NODE_ENV || 'development'}`}
            >
              {isProduction ? 'Prod' : 'Dev'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
