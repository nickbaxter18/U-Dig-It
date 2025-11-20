'use client';

import {
  Bell,
  Calendar,
  ChevronRight,
  Home,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Settings,
  User,
  X,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

interface MobileNavigationProps {
  className?: string;
}

/**
 * Mobile-optimized navigation component
 * Features:
 * - Bottom navigation bar for easy thumb access
 * - Slide-out menu with large touch targets
 * - Haptic feedback simulation
 * - Voice navigation support
 * - Accessibility enhancements
 * - One-handed operation support
 */
export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const { user, signIn: authSignIn, signOut: authSignOut, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isVoiceNavigationSupported, setIsVoiceNavigationSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Check for voice navigation support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsVoiceNavigationSupported(true);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Haptic feedback simulation
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30); // Short vibration
    }
  };

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    triggerHapticFeedback();
  };

  // Handle profile toggle
  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
    triggerHapticFeedback();
  };

  // Voice navigation handler
  const handleVoiceNavigation = () => {
    if (!isVoiceNavigationSupported) return;

    setIsListening(true);
    triggerHapticFeedback();

    const SpeechRecognition =
      (
        window as unknown as {
          webkitSpeechRecognition?: typeof SpeechRecognition;
          SpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: typeof SpeechRecognition;
          SpeechRecognition?: typeof SpeechRecognition;
        }
      ).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-CA';

    recognition.onresult = (event: unknown) => {
      const transcript = (
        event as { results: Array<Array<{ transcript: string }>> }
      ).results[0][0].transcript.toLowerCase();
      setIsListening(false);

      // Navigate based on voice command
      if (transcript.includes('home') || transcript.includes('main')) {
        window.location.href = '/';
      } else if (transcript.includes('book') || transcript.includes('booking')) {
        window.location.href = '/book';
      } else if (transcript.includes('profile') || transcript.includes('account')) {
        window.location.href = '/profile';
      } else if (transcript.includes('contact') || transcript.includes('phone')) {
        window.location.href = '/contact';
      } else if (transcript.includes('admin') || transcript.includes('dashboard')) {
        window.location.href = '/admin';
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Navigation items
  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, description: 'Main page' },
    { href: '/book', label: 'Book Now', icon: Calendar, description: 'Make a booking' },
    { href: '/contact', label: 'Contact', icon: Phone, description: 'Get in touch' },
    { href: '/location', label: 'Location', icon: MapPin, description: 'Find us' },
  ];

  const profileItems = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white ${className}`}
      >
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              typeof window !== 'undefined' && window.location.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center rounded-lg p-2 transition-colors ${
                  isActive
                    ? 'text-kubota-orange bg-kubota-orange/10'
                    : 'hover:text-kubota-orange text-gray-600'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
                onClick={triggerHapticFeedback}
              >
                <Icon className="h-6 w-6" />
                <span className="mt-1 hidden text-xs sm:block">{item.label}</span>
              </Link>
            );
          })}

          {/* Profile/Login Button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={handleProfileToggle}
              className={`flex flex-col items-center rounded-lg p-2 transition-colors ${
                isProfileOpen
                  ? 'text-kubota-orange bg-kubota-orange/10'
                  : 'hover:text-kubota-orange text-gray-600'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <User className="h-6 w-6" />
              <span className="mt-1 hidden text-xs sm:block">{user ? 'Profile' : 'Login'}</span>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                {user ? (
                  <>
                    <div className="border-b border-gray-100 px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {profileItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => {
                        authSignOut();
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      window.location.href = '/auth/signin';
                      setIsProfileOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="mr-3 h-4 w-4" />
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-kubota-orange rounded-full p-2">
              <Menu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <p className="text-sm text-gray-500">Navigation</p>
            </div>
          </div>
          <button
            onClick={handleMenuToggle}
            className="rounded-full p-2 hover:bg-gray-100"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="space-y-4 p-6">
          {/* Voice Navigation */}
          {isVoiceNavigationSupported && (
            <div className="mb-6">
              <button
                onClick={handleVoiceNavigation}
                disabled={isListening}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
                style={{ minHeight: '44px' }}
              >
                {isListening ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <span className="font-medium text-blue-600">Listening...</span>
                  </>
                ) : (
                  <>
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-600">Voice Navigation</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                typeof window !== 'undefined' && window.location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl p-4 transition-colors ${
                    isActive
                      ? 'bg-kubota-orange text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ minHeight: '44px' }}
                >
                  <Icon className="mr-4 h-6 w-6" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm opacity-75">{item.description}</div>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-gray-200 pt-6">
            {user ? (
              <div className="space-y-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-kubota-orange rounded-full p-2">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </div>

                {profileItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ minHeight: '44px' }}
                    >
                      <Icon className="mr-4 h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={() => {
                  window.location.href = '/auth/signin';
                  setIsMenuOpen(false);
                }}
                className="bg-kubota-orange hover:bg-kubota-orange-dark w-full rounded-xl p-4 font-medium text-white transition-colors"
                style={{ minHeight: '44px' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating Menu Button */}
      <button
        onClick={handleMenuToggle}
        className="bg-kubota-orange hover:bg-kubota-orange-dark fixed left-4 top-4 z-40 rounded-full p-3 text-white shadow-lg transition-colors"
        style={{ minHeight: '44px', minWidth: '44px' }}
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}
