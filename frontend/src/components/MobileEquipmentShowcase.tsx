'use client';

import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Hand,
  Maximize2,
  Pause,
  Phone,
  Play,
  Volume2,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

interface MobileEquipmentShowcaseProps {
  className?: string;
}

/**
 * Mobile-optimized equipment showcase component
 * Features:
 * - Touch-friendly image carousel with swipe gestures
 * - Auto-play with pause on touch
 * - Voice descriptions
 * - Accessibility enhancements
 * - One-handed operation support
 * - Haptic feedback
 */
export default function MobileEquipmentShowcase({ className = '' }: MobileEquipmentShowcaseProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Equipment images and details
  const equipmentImages = [
    {
      src: '/images/kubota-svl75-1.jpg',
      alt: 'Kubota SVL-75 front view',
      description:
        'Front view of the Kubota SVL-75 compact track loader showing the operator cab and controls',
    },
    {
      src: '/images/kubota-svl75-2.jpg',
      alt: 'Kubota SVL-75 side view',
      description:
        'Side profile of the Kubota SVL-75 showing the track system and hydraulic components',
    },
    {
      src: '/images/kubota-svl75-3.jpg',
      alt: 'Kubota SVL-75 bucket view',
      description: 'Close-up of the Kubota SVL-75 bucket and attachment system',
    },
    {
      src: '/images/kubota-svl75-4.jpg',
      alt: 'Kubota SVL-75 operator cab',
      description:
        'Interior view of the Kubota SVL-75 operator cab with comfortable seating and controls',
    },
  ];

  const equipmentSpecs = [
    { label: 'Operating Weight', value: '9,039 lbs', icon: '⚖️' },
    { label: 'Rated Capacity', value: '2,630 lbs', icon: '🏗️' },
    { label: 'Horsepower', value: '74.3 hp', icon: '⚡' },
    { label: 'Dump Height', value: '10.4 ft', icon: '📏' },
    { label: 'Width', value: '66 in', icon: '📐' },
    { label: 'Daily Rate', value: '$450 CAD', icon: '💰' },
  ];

  const features = [
    'Advanced hydraulic system for smooth operation',
    'Comfortable operator cab with climate control',
    'Durable track system for all terrain',
    'Quick-attach bucket system',
    'Low fuel consumption and emissions',
    'Easy maintenance access',
  ];

  // Check for voice support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsVoiceSupported(true);
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % equipmentImages.length);
      }, 4000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, equipmentImages.length]);

  // Haptic feedback
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsAutoPlaying(false); // Pause auto-play on touch
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
        // Swipe right - previous image
        goToPreviousImage();
      } else {
        // Swipe left - next image
        goToNextImage();
      }
      triggerHapticFeedback();
    }

    setTouchStart(null);
  };

  // Navigation functions
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % equipmentImages.length);
    triggerHapticFeedback();
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + equipmentImages.length) % equipmentImages.length);
    triggerHapticFeedback();
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    triggerHapticFeedback();
  };

  // Voice description
  const speakDescription = () => {
    if (!isVoiceSupported) return;

    // Stop any current speech
    if (speechRef.current) {
      speechSynthesis.cancel();
    }

    const currentImage = equipmentImages[currentImageIndex];
    const utterance = new SpeechSynthesisUtterance(currentImage.description);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
    triggerHapticFeedback();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      carouselRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    triggerHapticFeedback();
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kubota SVL-75</h2>
            <p className="text-gray-600">Compact Track Loader</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {isAutoPlaying ? (
                <Pause className="h-5 w-5 text-gray-600" />
              ) : (
                <Play className="h-5 w-5 text-gray-600" />
              )}
            </button>
            {isVoiceSupported && (
              <button
                onClick={speakDescription}
                disabled={isSpeaking}
                className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {isSpeaking ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-600"></div>
                ) : (
                  <Volume2 className="h-5 w-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {equipmentImages.map((image: unknown, index: unknown) => (
              <div key={index} className="relative w-full flex-shrink-0">
                <img src={image.src} alt={image.alt} className="h-64 w-full object-cover sm:h-80" />
                <div className="absolute inset-0 flex items-end bg-black bg-opacity-20">
                  <div className="p-4 text-white">
                    <p className="text-sm opacity-90">{image.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPreviousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 transform rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute right-4 top-4 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-70"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Maximize2 className="h-5 w-5" />
          </button>

          {/* Swipe Indicator */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform items-center space-x-1">
            <Hand className="h-4 w-4 text-white opacity-70" />
            <span className="text-xs text-white opacity-70">Swipe to navigate</span>
          </div>
        </div>

        {/* Image Indicators */}
        <div className="flex justify-center space-x-2 p-4">
          {equipmentImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`h-3 w-3 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-kubota-orange' : 'bg-gray-300'
              }`}
              style={{ minHeight: '12px', minWidth: '12px' }}
            />
          ))}
        </div>
      </div>

      {/* Equipment Details */}
      <div className="space-y-6 p-6">
        {/* Specifications */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Specifications</h3>
          <div className="grid grid-cols-2 gap-4">
            {equipmentSpecs.map((spec: unknown, index: unknown) => (
              <div key={index} className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
                <span className="text-2xl">{spec.icon}</span>
                <div>
                  <div className="text-sm text-gray-600">{spec.label}</div>
                  <div className="font-semibold text-gray-900">{spec.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Key Features</h3>
          <div className="space-y-3">
            {features.map((feature: unknown, index: unknown) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => (window.location.href = '/book')}
            className="bg-kubota-orange hover:bg-kubota-orange-dark flex items-center justify-center space-x-2 rounded-xl p-4 font-semibold text-white transition-colors"
            style={{ minHeight: '44px' }}
          >
            <Calendar className="h-5 w-5" />
            <span>Book Now</span>
          </button>
          <button
            onClick={() => (window.location.href = '/contact')}
            className="flex items-center justify-center space-x-2 rounded-xl bg-gray-100 p-4 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            style={{ minHeight: '44px' }}
          >
            <Phone className="h-5 w-5" />
            <span>Contact</span>
          </button>
        </div>

        {/* Mobile Features Info */}
        <div className="rounded-xl bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Mobile Features</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <Hand className="h-4 w-4" />
              <span>Swipe to navigate images</span>
            </div>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4" />
              <span>Voice descriptions available</span>
            </div>
            <div className="flex items-center space-x-2">
              <Maximize2 className="h-4 w-4" />
              <span>Fullscreen viewing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Auto-play with touch pause</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
