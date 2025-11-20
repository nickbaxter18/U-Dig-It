'use client';

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Hand,
  Maximize2,
  Smartphone,
  Volume2,
} from 'lucide-react';

import { useState } from 'react';

import MobileContactForm from '@/components/MobileContactForm';
import MobileEquipmentShowcase from '@/components/MobileEquipmentShowcase';
import MobileNavigation from '@/components/MobileNavigation';
import MobileOptimizedBooking from '@/components/MobileOptimizedBooking';

import { logger } from '@/lib/logger';

/**
 * Mobile Demo Page
 * Showcases all mobile-optimized components and features
 */
export default function MobileDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  // Removed unused state: isExpanded, setIsExpanded

  const demos = [
    {
      id: 'booking',
      title: 'Mobile Booking Flow',
      description: 'Touch-optimized booking with swipe gestures and voice input',
      component: MobileOptimizedBooking,
      features: [
        'Swipe gestures for date selection',
        'Voice input support',
        'Large touch targets (44px minimum)',
        'Quick date presets',
        'Haptic feedback simulation',
      ],
    },
    {
      id: 'navigation',
      title: 'Mobile Navigation',
      description: 'Bottom navigation bar with slide-out menu and voice navigation',
      component: MobileNavigation,
      features: [
        'Bottom navigation for thumb access',
        'Slide-out menu with large touch targets',
        'Voice navigation support',
        'Profile dropdown with user actions',
        'Haptic feedback on interactions',
      ],
    },
    {
      id: 'showcase',
      title: 'Equipment Showcase',
      description: 'Interactive equipment display with touch carousel and voice descriptions',
      component: MobileEquipmentShowcase,
      features: [
        'Touch-friendly image carousel',
        'Swipe gestures for navigation',
        'Auto-play with touch pause',
        'Voice descriptions',
        'Fullscreen viewing support',
      ],
    },
    {
      id: 'contact',
      title: 'Contact Form',
      description: 'Accessible contact form with voice input and auto-save',
      component: MobileContactForm,
      features: [
        'Voice input for all fields',
        'Auto-save to localStorage',
        'Audio feedback and confirmations',
        'Large touch targets',
        'Form validation with clear errors',
      ],
    },
  ];

  const handleDemoSelect = (demoId: string) => {
    setActiveDemo(activeDemo === demoId ? null : demoId);
  };

  const handleDateSelect = (startDate: string, endDate: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Selected dates:', {
        component: 'app-page',
        action: 'debug',
        metadata: { startDate, endDate },
      });
    }
  };

  const handleLocationSelect = (address: string, city: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Selected location:', {
        component: 'app-page',
        action: 'debug',
        metadata: { address, city },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-kubota-orange rounded-full p-3">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mobile Demo</h1>
              <p className="text-gray-600">
                Touch-optimized components for the Kubota rental platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Features Overview */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Mobile Optimization Features</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 p-4">
                <Hand className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Touch Optimized</h3>
              <p className="text-sm text-gray-600">
                44px minimum touch targets, swipe gestures, haptic feedback
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-4">
                <Volume2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Voice Support</h3>
              <p className="text-sm text-gray-600">Voice input, navigation, and audio feedback</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 p-4">
                <Maximize2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Accessibility</h3>
              <p className="text-sm text-gray-600">
                Screen reader support, keyboard navigation, ARIA labels
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 p-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">One-Handed Use</h3>
              <p className="text-sm text-gray-600">Bottom navigation, thumb-friendly controls</p>
            </div>
          </div>
        </div>

        {/* Demo Components */}
        <div className="space-y-8">
          {demos.map((demo) => {
            const Component = demo.component;
            const isActive = activeDemo === demo.id;

            return (
              <div key={demo.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* Demo Header */}
                <div
                  className="cursor-pointer p-6 transition-colors hover:bg-gray-50"
                  onClick={() => handleDemoSelect(demo.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-gray-900">{demo.title}</h3>
                      <p className="mb-4 text-gray-600">{demo.description}</p>

                      {/* Features List */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {demo.features.map((feature: unknown, index: unknown) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ml-4">
                      {isActive ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Demo Component */}
                {isActive && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="mx-auto max-w-2xl">
                      {demo.id === 'booking' && (
                        <Component
                          onDateSelect={handleDateSelect}
                          onLocationSelect={handleLocationSelect}
                        />
                      )}
                      {demo.id === 'navigation' && <Component {...({} as any)} />}
                      {demo.id === 'showcase' && <Component {...({} as any)} />}
                      {demo.id === 'contact' && <Component {...({} as any)} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Implementation Notes */}
        <div className="mt-12 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Implementation Notes</h2>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Touch Targets</h3>
              <p className="text-gray-600">
                All interactive elements meet the 44px minimum touch target size recommended by
                Apple and Google. This ensures comfortable one-handed operation on mobile devices.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Voice Input</h3>
              <p className="text-gray-600">
                Voice input is supported using the Web Speech API. Users can speak their input
                instead of typing, which is especially useful for longer text fields and when on the
                go.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Haptic Feedback</h3>
              <p className="text-gray-600">
                Haptic feedback is simulated using the Vibration API where supported. This provides
                tactile confirmation of user interactions, improving the mobile experience.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Accessibility</h3>
              <p className="text-gray-600">
                All components include proper ARIA labels, keyboard navigation support, and screen
                reader compatibility. Voice descriptions are available for visual content.
              </p>
            </div>
          </div>
        </div>

        {/* Browser Support */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Browser Support</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Voice Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Chrome/Edge: Full support</li>
                <li>• Safari: Limited support</li>
                <li>• Firefox: Not supported</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Touch Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• All modern browsers: Full support</li>
                <li>• iOS Safari: Full support</li>
                <li>• Android Chrome: Full support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Demo */}
      <MobileNavigation />
    </div>
  );
}
