'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Hand,
  MapPin,
  Smartphone,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

interface MobileOptimizedBookingProps {
  onDateSelect: (startDate: string, endDate: string) => void;
  onLocationSelect: (address: string, city: string) => void;
  onBookingComplete?: (bookingData: unknown) => void;
  className?: string;
}

/**
 * Mobile-optimized booking component with enhanced touch interactions
 * Features:
 * - Large touch targets (44px minimum)
 * - Swipe gestures for date selection
 * - Haptic feedback simulation
 * - Optimized for one-handed use
 * - Voice input support
 * - Accessibility enhancements
 */
export default function MobileOptimizedBooking({
  onDateSelect,
  onLocationSelect,
  className = '',
}: MobileOptimizedBookingProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isVoiceInputSupported, setIsVoiceInputSupported] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Check for voice input support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsVoiceInputSupported(true);
    }
  }, []);

  // Haptic feedback simulation
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  // Handle touch end with swipe detection
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const minSwipeDistance = 50;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous day
        handleSwipeDate(-1);
      } else {
        // Swipe left - go to next day
        handleSwipeDate(1);
      }
      triggerHapticFeedback();
    }

    setTouchStart(null);
  };

  // Handle date swiping
  const handleSwipeDate = (direction: number) => {
    if (!startDate) {
      const today = new Date();
      const newDate = new Date(today.getTime() + direction * 24 * 60 * 60 * 1000);
      setStartDate(newDate.toISOString().split('T')[0]);
    } else {
      const currentDate = new Date(startDate);
      const newDate = new Date(currentDate.getTime() + direction * 24 * 60 * 60 * 1000);
      setStartDate(newDate.toISOString().split('T')[0]);

      if (endDate) {
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil(
          (endDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const newEndDate = new Date(newDate.getTime() + daysDiff * 24 * 60 * 60 * 1000);
        setEndDate(newEndDate.toISOString().split('T')[0]);
      }
    }
  };

  // Voice input handler
  const handleVoiceInput = () => {
    if (!isVoiceInputSupported) return;

    setIsProcessingVoice(true);
    triggerHapticFeedback();

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-CA';

    recognition.onresult = (event: unknown) => {
      const transcript = (event as any).results[0][0].transcript.toLowerCase();
      setIsProcessingVoice(false);

      // Parse voice input for dates
      if (transcript.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setStartDate(tomorrow.toISOString().split('T')[0]);
      } else if (transcript.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setStartDate(nextWeek.toISOString().split('T')[0]);
      } else if (transcript.includes('weekend')) {
        const today = new Date();
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
        setStartDate(nextSaturday.toISOString().split('T')[0]);
      }

      // Parse for location
      if (transcript.includes('saint john')) {
        setDeliveryCity('Saint John');
      } else if (transcript.includes('rothesay')) {
        setDeliveryCity('Rothesay');
      }
    };

    recognition.onerror = () => {
      setIsProcessingVoice(false);
    };

    recognition.start();
  };

  // Handle form submission
  const handleSubmit = () => {
    if (startDate && endDate && deliveryAddress && deliveryCity) {
      onDateSelect(startDate, endDate);
      onLocationSelect(deliveryAddress, deliveryCity);
      triggerHapticFeedback();
    }
  };

  // Quick date presets
  const quickDatePresets = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'This Weekend', days: 6 - new Date().getDay() },
    { label: 'Next Week', days: 7 },
  ];

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setStartDate(date.toISOString().split('T')[0]);

    // Set end date to next day
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1);
    setEndDate(endDate.toISOString().split('T')[0]);

    triggerHapticFeedback();
  };

  return (
    <div className={`rounded-2xl bg-white p-6 shadow-lg ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-kubota-orange rounded-full p-2">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Book</h2>
            <p className="text-sm text-gray-500">Mobile optimized</p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {isExpanded ? (
            <ChevronUp className="h-6 w-6 text-gray-600" />
          ) : (
            <ChevronDown className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Quick Date Presets */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Quick Select</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickDatePresets.map((preset: unknown, index: unknown) => (
            <button
              key={index}
              onClick={() => handleQuickDate(preset.days)}
              className="hover:bg-kubota-orange rounded-xl bg-gray-50 p-4 text-left transition-colors hover:text-white"
              style={{ minHeight: '44px' }}
            >
              <div className="text-sm font-medium">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection with Swipe Support */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Select Dates</h3>
        <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus:border-kubota-orange w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:ring-0"
                style={{ minHeight: '44px' }}
              />
              <Calendar className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="focus:border-kubota-orange w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:ring-0"
                style={{ minHeight: '44px' }}
              />
              <Calendar className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <Hand className="mr-1 inline h-4 w-4" />
            Swipe left/right to change dates
          </div>
        </div>
      </div>

      {/* Location Selection */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Delivery Location</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
            <div className="relative">
              <input
                ref={addressInputRef}
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                className="focus:border-kubota-orange w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:ring-0"
                style={{ minHeight: '44px' }}
              />
              <MapPin className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
            <select
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="focus:border-kubota-orange w-full rounded-xl border-2 border-gray-200 p-4 text-lg focus:ring-0"
              style={{ minHeight: '44px' }}
            >
              <option value="">Select city</option>
              <option value="Saint John">Saint John</option>
              <option value="Rothesay">Rothesay</option>
              <option value="Quispamsis">Quispamsis</option>
              <option value="Grand Bay-Westfield">Grand Bay-Westfield</option>
              <option value="Hampton">Hampton</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Input Button */}
      {isVoiceInputSupported && (
        <div className="mb-6">
          <button
            onClick={handleVoiceInput}
            disabled={isProcessingVoice}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
            style={{ minHeight: '44px' }}
          >
            {isProcessingVoice ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span className="font-medium text-blue-600">Listening...</span>
              </>
            ) : (
              <>
                <Hand className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-600">Voice Input</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!startDate || !endDate || !deliveryAddress || !deliveryCity}
        className="bg-kubota-orange hover:bg-kubota-orange-dark w-full rounded-xl p-4 text-lg font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: '44px' }}
      >
        Check Availability
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Mobile Features</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Hand className="text-kubota-orange h-4 w-4" />
              <span>Swipe gestures for date selection</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Large touch targets (44px minimum)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Quick date presets</span>
            </div>
            {isVoiceInputSupported && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                <span>Voice input support</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
