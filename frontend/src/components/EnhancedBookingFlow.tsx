'use client';

import { checkAvailabilityEnhanced, createBookingEnhanced } from '@/app/book/actions-v2';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import Link from 'next/link';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { calculateRentalCost, formatCurrency } from '@/lib/utils';

import AvailabilityCalendar from './AvailabilityCalendar';
import DiscountCodeInput, { type AppliedDiscount } from './DiscountCodeInput';
import LoadingOverlay from './LoadingOverlay';
import LocationPicker, { type LocationData } from './LocationPicker';
import BookingConfirmedModal from './booking/BookingConfirmedModal';
import HoldPaymentModal from './booking/HoldPaymentModal';
import HoldSystemExplanationModal from './booking/HoldSystemExplanationModal';

type Step = 1 | 2 | 3;

interface ValidationErrors {
  startDate?: string;
  endDate?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  customerEmail?: string;
  customerName?: string;
  general?: string;
}

interface BookingResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  bookingNumber?: string;
  booking?: {
    id: string;
  };
  pricing?: {
    total: number;
    subtotal?: number;
    taxes?: number;
    deliveryFee?: number;
    discountAmount?: number;
  };
}

/**
 * Props for the EnhancedBookingFlow component
 */
interface EnhancedBookingFlowProps {
  /** Type of progress indicator to display */
  progressIndicator?: 'animated' | 'simple' | 'none';
  /** Additional CSS classes for styling */
  className?: string;
  /** Whether to resume from saved booking data */
  shouldResume?: boolean;
}

const DAILY_RATE = 450;
const TAX_RATE = 0.15;

const SERVICE_AREAS = [
  { value: 'Saint John', label: 'Saint John', fee: 300 },
  { value: 'Rothesay', label: 'Rothesay', fee: 320 },
  { value: 'Quispamsis', label: 'Quispamsis', fee: 350 },
  { value: 'Grand Bay-Westfield', label: 'Grand Bay-Westfield', fee: 350 },
  { value: 'Hampton', label: 'Hampton', fee: 380 },
  { value: 'Other', label: "Other (we'll confirm pricing)", fee: 400 },
];

/**
 * State machine for equipment availability checking
 */
type AvailabilityState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

/**
 * Enhanced booking flow component with smart features and multi-step process
 *
 * Features:
 * - Multi-step booking process with validation
 * - Real-time availability checking
 * - Smart date suggestions and pricing
 * - Guest checkout support
 * - Mobile-optimized design
 *
 * @param props - Component configuration options
 * @returns JSX element for the booking flow
 */
export default function EnhancedBookingFlow({
  progressIndicator = 'animated',
  className = '',
  shouldResume = false,
}: EnhancedBookingFlowProps) {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryProvince: '',
    deliveryPostalCode: '',
    customerEmail: '',
    customerName: '',
    specialInstructions: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>({ status: 'idle' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [waiverSelected, setWaiverSelected] = useState(false);

  // Ref for scroll-to-top on step changes
  const bookingFlowTopRef = useRef<HTMLDivElement>(null);
  const exitNotificationSentRef = useRef(false);

  // Hold System Modal States
  const [showHoldExplanation, setShowHoldExplanation] = useState(false);
  const [showHoldPayment, setShowHoldPayment] = useState(false);
  const [showBookingConfirmed, setShowBookingConfirmed] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const [isCheckingAvailability, startAvailabilityTransition] = useTransition();
  const [, startSubmitTransition] = useTransition();
  const bookingCompleted = Boolean(bookingResult?.success);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    exitNotificationSentRef.current = sessionStorage.getItem('booking-exit-notified') === 'true';
  }, []);

  const notifyBookingExit = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (exitNotificationSentRef.current) return;
    if (showBookingConfirmed || bookingCompleted) return;
    if (!user) return;

    const hasMeaningfulProgress = Boolean(
      formData.startDate ||
        formData.endDate ||
        formData.deliveryAddress ||
        formData.deliveryCity ||
        formData.customerEmail
    );

    if (!hasMeaningfulProgress) return;

    const payload = JSON.stringify({
      step,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      deliveryCity: formData.deliveryCity || undefined,
    });

    exitNotificationSentRef.current = true;
    sessionStorage.setItem('booking-exit-notified', 'true');

    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/notifications/booking-exit', blob);
      } else {
        fetch('/api/notifications/booking-exit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Ignore errors triggered during unload
        });
      }
    } catch (error) {
      logger.debug('[BookingFlow] Failed to send exit notification beacon', {
        component: 'EnhancedBookingFlow',
        action: 'exit_notification_debug',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }, [
    bookingCompleted,
    formData.customerEmail,
    formData.deliveryAddress,
    formData.deliveryCity,
    formData.endDate,
    formData.startDate,
    showBookingConfirmed,
    step,
    user,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      notifyBookingExit();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        notifyBookingExit();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [notifyBookingExit]);

  // Auto-populate customer data from logged-in user
  useEffect(() => {
    if (user && !authLoading) {
      const firstName = user.user_metadata?.firstName || '';
      const lastName = user.user_metadata?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email || '';

      setFormData((prev) => ({
        ...prev,
        customerEmail: user.email || prev.customerEmail,
        customerName: fullName,
      }));
    }
  }, [user, authLoading]);

  // Load saved form data from localStorage on mount or when shouldResume is true
  useEffect(() => {
    const savedFormData = localStorage.getItem('booking-form-draft');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        const savedDate = new Date(parsed.savedAt);
        const now = new Date();
        const hoursSinceSaved = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

        // Restore if saved within last 24 hours, or if shouldResume is true (even if older)
        const shouldRestore = shouldResume || hoursSinceSaved < 24;

        if (shouldRestore) {
          setFormData(parsed.formData);
          setStep(parsed.step || 1);
          if (parsed.locationData) {
            setLocationData(parsed.locationData);
          }
          logger.debug('[BookingFlow] Restored saved progress from localStorage', {
            component: 'EnhancedBookingFlow',
            action: 'debug',
            metadata: { shouldResume, hoursSinceSaved },
          });
        } else {
          // Clear old data
          localStorage.removeItem('booking-form-draft');
        }
      } catch (error) {
        logger.error(
          '[BookingFlow] Error loading saved form data:',
          {
            component: 'EnhancedBookingFlow',
            action: 'error',
          },
          error instanceof Error ? error : undefined
        );
        localStorage.removeItem('booking-form-draft');
      }
    } else if (shouldResume) {
      // If shouldResume is true but no saved data, log a warning
      logger.warn('[BookingFlow] Resume requested but no saved booking data found', {
        component: 'EnhancedBookingFlow',
        action: 'resume_no_data',
      });
    }
  }, [shouldResume]);

  // Save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (step < 5 && (formData.startDate || formData.deliveryAddress)) {
      const saveTimeout = setTimeout(() => {
        try {
          const dataToSave = {
            formData,
            step,
            locationData,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem('booking-form-draft', JSON.stringify(dataToSave));
          logger.debug('[BookingFlow] Auto-saved progress to localStorage', {
            component: 'EnhancedBookingFlow',
            action: 'debug',
          });
        } catch (error) {
          logger.error(
            '[BookingFlow] Error saving form data:',
            {
              component: 'EnhancedBookingFlow',
              action: 'error',
            },
            error instanceof Error ? error : undefined
          );
        }
      }, 1000); // Debounce by 1 second

      return () => clearTimeout(saveTimeout);
    }
  }, [formData, step, locationData]);

  // Clear saved data when booking is confirmed
  useEffect(() => {
    if (showBookingConfirmed && bookingResult) {
      localStorage.removeItem('booking-form-draft');
      setSubmitError(null);
      setErrors({});
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('booking-exit-notified');
      }
      exitNotificationSentRef.current = false;
      logger.debug('[BookingFlow] Cleared saved progress - booking completed', {
        component: 'EnhancedBookingFlow',
        action: 'debug',
      });
    }
  }, [showBookingConfirmed, bookingResult]);

  const selectedArea = useMemo(
    () => SERVICE_AREAS.find((area) => area.value === formData.deliveryCity),
    [formData.deliveryCity]
  );

  const rentalDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) {
      return 0;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return 0;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [formData.startDate, formData.endDate]);

  const pricing = useMemo(() => {
    if (rentalDays === 0) return null;

    const baseCost = calculateRentalCost(
      formData.startDate,
      formData.endDate,
      DAILY_RATE,
      TAX_RATE
    );
    // Use locationData's delivery fee if available, otherwise fall back to selectedArea
    const deliveryFee = locationData?.deliveryFee || selectedArea?.fee || 0;

    // Calculate waiver cost ($29/day) - added to subtotal BEFORE discount
    const waiverCost = waiverSelected ? rentalDays * 29 : 0;
    const holdAmount = 500; // Always $500, waiver protects it from damage charges

    // Calculate subtotal INCLUDING waiver BEFORE discount
    const subtotalBeforeDiscount = baseCost.subtotal + deliveryFee + waiverCost;

    // Calculate discount dynamically based on CURRENT subtotal (includes waiver!)
    let discountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        // Percentage discount: apply to full subtotal including waiver
        discountAmount = subtotalBeforeDiscount * (appliedDiscount.value / 100);
      } else {
        // Fixed amount discount: cannot exceed subtotal
        discountAmount = Math.min(appliedDiscount.value, subtotalBeforeDiscount);
      }
    }

    // Subtotal after discount
    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;

    // Calculate taxes on discounted amount
    const taxes = subtotalAfterDiscount * TAX_RATE;

    const total = subtotalAfterDiscount + taxes;

    return {
      days: baseCost.days,
      subtotal: baseCost.subtotal,
      taxes: taxes,
      deliveryFee,
      distanceKm: locationData?.distanceKm || 0,
      discountAmount,
      waiverCost,
      holdAmount,
      total,
    };
  }, [
    rentalDays,
    formData.startDate,
    formData.endDate,
    selectedArea,
    locationData,
    appliedDiscount,
    waiverSelected,
  ]);

  /**
   * Validates form data for the current step with comprehensive error checking
   *
   * @param step - Current step number (1-4)
   * @returns True if validation passes, false otherwise
   */
  const validateForm = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step >= 1) {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      } else {
        const startDate = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          newErrors.startDate = 'Start date cannot be in the past';
        }
      }

      if (!formData.endDate) {
        newErrors.endDate = 'End date is required';
      } else if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (endDate <= startDate) {
          newErrors.endDate =
            'End date must be at least 1 day after start date (minimum 1-day rental)';
        }
      }
    }

    if (step >= 2) {
      if (!formData.deliveryAddress?.trim()) {
        newErrors.deliveryAddress = 'Delivery address is required';
      }

      if (!formData.deliveryCity) {
        newErrors.deliveryCity = 'Please select a delivery area';
      }
    }

    // Step 3 (Review & Confirm) and Step 4 (Contract Signing) have their own validation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Scroll to the top of the booking flow to show the progress indicator
   * Called after step transitions to ensure users see the updated progress
   * Scrolls slightly above the element to ensure full visibility
   */
  const scrollToTop = () => {
    if (bookingFlowTopRef.current) {
      const element = bookingFlowTopRef.current;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 80; // 80px offset to show full top section

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
      // Scroll to top to show progress indicator
      scrollToTop();
    }
  };

  const handleNext = () => {
    if (validateForm(step)) {
      if (step === 1) {
        // Check availability
        startAvailabilityTransition(async () => {
          setAvailabilityState({ status: 'checking' });
          try {
            const result = await checkAvailabilityEnhanced(formData.startDate, formData.endDate, {
              includeAlternatives: true,
            });

            if (result.available) {
              setAvailabilityState({
                status: 'available',
                message: 'Equipment is available for your selected dates!',
              });
              setStep(2);
              // Scroll to top to show progress indicator after a brief delay for DOM update
              setTimeout(() => scrollToTop(), 100);
            } else {
              setAvailabilityState({
                status: 'unavailable',
                message:
                  result.message ||
                  'Equipment is not available for your selected dates. Please choose different dates.',
              });
            }
          } catch {
            setAvailabilityState({
              status: 'error',
              message: 'Failed to check availability. Please try again.',
            });
          }
        });
      } else if (step === 2) {
        // User must be authenticated to proceed
        if (!user) {
          setErrors({ general: 'Please sign in to continue with your booking' });
          return;
        }
        setStep(3);
        // Scroll to top to show progress indicator
        scrollToTop();
      } else if (step === 3) {
        // Show hold explanation modal instead of creating booking immediately
        setShowHoldExplanation(true);
      }
    }
  };

  /* Contract signing moved to manage booking page
  const handleContractSigned = async (contractId: string) => {
    logger.debug('✅ Contract signed successfully', {
      component: 'EnhancedBookingFlow',
      action: 'debug',
      metadata: { contractId },
    });

    // Update booking to confirmed status
    if (bookingResult?.booking?.id) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          contractSignedAt: new Date().toISOString(),
        })
        .eq('id', bookingResult.booking.id);
    }

    // Move to Step 5 (Success page)
    setStep(5);
  }; */

  const getStepProgress = () => {
    return ((step - 1) / 2) * 100;
  };

  // Handle hold system workflow
  const handleProceedToPayment = () => {
    setShowHoldExplanation(false);

    // Calculate all pricing before saving
    const equipmentSubtotal = pricing?.subtotal || 0;
    const deliveryTotal = pricing?.deliveryFee || 0;
    const waiverTotal = pricing?.waiverCost || 0;
    const discountTotal = pricing?.discountAmount || 0;

    // Subtotal = Equipment + Delivery + Waiver - Discount
    const subtotalBeforeDiscount = equipmentSubtotal + deliveryTotal + waiverTotal;
    const subtotalAfterDiscount = subtotalBeforeDiscount - discountTotal;

    // Taxes on discounted subtotal
    const taxes = subtotalAfterDiscount * TAX_RATE;

    // Final total
    const totalAmount = subtotalAfterDiscount + taxes;

    // Save booking form data to localStorage before Stripe redirect
    // This will be retrieved after Stripe success to create the booking
    const bookingFormData = {
      ...formData,
      customerId: user?.id,
      locationData,
      appliedDiscount,
      waiverSelected,
      rentalDays,
      // ✅ Include ALL pricing fields for accurate invoice
      equipmentId: '96488a54-2649-4e1f-8a55-9eac48de5a4d', // SVL-75
      dailyRate: DAILY_RATE,
      weeklyRate: DAILY_RATE * 5,
      monthlyRate: DAILY_RATE * 20,
      subtotal: equipmentSubtotal,
      taxes: taxes,
      floatFee: 300, // Flat float fee (base delivery)
      deliveryFee: deliveryTotal,
      totalAmount: totalAmount,
      waiverCost: waiverTotal,
      discountAmount: discountTotal,
      distanceKm: locationData?.distanceKm || 0,
      timestamp: Date.now(),
    };

    logger.info('Saving booking form data to localStorage', {
      component: 'EnhancedBookingFlow',
      action: 'save_form_data',
      metadata: {
        dataKeys: Object.keys(bookingFormData),
        totalAmount,
        subtotal: equipmentSubtotal,
        deliveryFee: deliveryTotal,
        taxes,
      },
    });

    localStorage.setItem('pending_booking_data', JSON.stringify(bookingFormData));

    // Create a temporary booking ID for card verification
    const tempBookingId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setBookingResult({
      success: false,
      bookingId: tempBookingId,
      bookingNumber: `TEMP-${tempBookingId.slice(-6).toUpperCase()}`,
    });

    setShowHoldPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowHoldPayment(false);

    // Create the booking now (after successful card verification)
    if (!validateForm(3)) return;

    // Ensure user is logged in
    if (!user || !user.id) {
      setErrors({ general: 'You must be logged in to create a booking' });
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      startSubmitTransition(async () => {
        // Convert plain object to FormData
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value as string);
        });

        // Add user ID to form data
        formDataObj.append('customerId', user.id);

        // Add calculated delivery fee and distance from LocationPicker
        if (locationData) {
          formDataObj.append('calculatedDeliveryFee', locationData.deliveryFee.toString());
          formDataObj.append('distanceKm', locationData.distanceKm.toString());

          if (process.env.NODE_ENV === 'development') {
            logger.debug('[EnhancedBookingFlow] Adding location data to form', {
              component: 'EnhancedBookingFlow',
              action: 'debug',
              metadata: {
                deliveryFee: locationData.deliveryFee,
                distanceKm: locationData.distanceKm,
              },
            });
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            logger.warn('[EnhancedBookingFlow] No locationData available!', {
              component: 'EnhancedBookingFlow',
              action: 'warning',
            });
          }
        }

        // ✅ CRITICAL FIX: Always add coupon fields (even if null) to avoid database constraint errors
        // Database expects these fields to be NULL when no coupon is applied
        if (appliedDiscount) {
          formDataObj.append('couponCode', appliedDiscount.code);
          formDataObj.append('couponType', appliedDiscount.type);
          formDataObj.append('couponValue', appliedDiscount.value.toString());

          if (process.env.NODE_ENV === 'development') {
            logger.debug('[EnhancedBookingFlow] Adding coupon code to form', {
              component: 'EnhancedBookingFlow',
              action: 'debug',
              metadata: {
                couponCode: appliedDiscount.code,
                couponType: appliedDiscount.type,
                couponValue: appliedDiscount.value,
              },
            });
          }
        } else {
          // ✅ FIX: Explicitly append null values when no coupon applied
          // This ensures the server receives null instead of undefined
          formDataObj.append('couponCode', '');
          formDataObj.append('couponType', '');
          formDataObj.append('couponValue', '');

          if (process.env.NODE_ENV === 'development') {
            logger.debug('[EnhancedBookingFlow] No coupon applied, adding empty values', {
              component: 'EnhancedBookingFlow',
              action: 'debug',
            });
          }
        }

        // Add waiver data if enabled
        if (waiverSelected) {
          formDataObj.append('waiverEnabled', 'true');
          formDataObj.append('waiverDays', rentalDays.toString());

          if (process.env.NODE_ENV === 'development') {
            logger.debug('[EnhancedBookingFlow] Adding waiver data to form', {
              component: 'EnhancedBookingFlow',
              action: 'debug',
              metadata: {
                waiverEnabled: waiverSelected,
                waiverDays: rentalDays,
              },
            });
          }
        }

        // Create booking
        const result = await createBookingEnhanced(formDataObj);

        if (process.env.NODE_ENV === 'development') {
          logger.debug('[EnhancedBookingFlow] Server Action result', {
            component: 'EnhancedBookingFlow',
            action: 'debug',
            metadata: { result },
          });
        }

        if (result.success && result.bookingId) {
          setBookingResult({
            success: true,
            bookingId: result.bookingId,
            bookingNumber: result.bookingNumber || `UD-${result.bookingId.slice(-6).toUpperCase()}`,
          });

          // Now show the booking confirmed modal
          setShowBookingConfirmed(true);
        } else {
          throw new Error(result.error || 'Failed to create booking');
        }
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create booking. Please try again.';

      logger.error(
        '[EnhancedBookingFlow] Booking creation failed',
        {
          component: 'EnhancedBookingFlow',
          action: 'error',
          metadata: { error: errorMessage },
        },
        error instanceof Error ? error : undefined
      );

      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setHoldError(error);
    setShowHoldPayment(false);
    setShowHoldExplanation(false);
    setSubmitError(error);
  };

  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay
        show={isLoading}
        message={step === 3 ? 'Creating Your Booking...' : 'Processing...'}
        submessage={step === 3 ? 'Please wait while we confirm your reservation' : undefined}
      />

      {/* Hold System Explanation Modal */}
      <HoldSystemExplanationModal
        isOpen={showHoldExplanation}
        startDate={formData.startDate}
        onClose={() => {
          setShowHoldExplanation(false);
          setBookingResult(null);
        }}
        onProceed={handleProceedToPayment}
      />

      {/* Hold Payment Modal (Stripe Elements) */}
      {showHoldPayment && user?.id && (
        <HoldPaymentModal
          isOpen={showHoldPayment}
          bookingId={bookingResult?.bookingId || 'pending'}
          customerId={user.id}
          startDate={formData.startDate}
          totalAmount={pricing?.total || 0}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => {
            setShowHoldPayment(false);
            setShowHoldExplanation(false);
          }}
        />
      )}

      {/* Booking Confirmed Modal */}
      {bookingResult?.bookingNumber && bookingResult?.bookingId && (
        <BookingConfirmedModal
          isOpen={showBookingConfirmed}
          bookingNumber={bookingResult.bookingNumber}
          bookingId={bookingResult.bookingId}
        />
      )}

      <div
        ref={bookingFlowTopRef}
        className={`smart-form mx-auto max-w-2xl rounded-lg bg-white p-4 shadow-lg sm:p-8 ${className}`}
      >
        {/* Progress Indicator */}
        {progressIndicator === 'animated' && (
          <div className="mb-8">
            <div
              className="mb-4 flex items-center justify-between"
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`Booking progress: step ${step} of 3`}
            >
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`booking-step ${
                      step >= stepNum ? 'active' : step > stepNum ? 'completed' : 'inactive'
                    }`}
                    aria-label={`Step ${stepNum}${step > stepNum ? ' completed' : step === stepNum ? ' current' : ''}`}
                  >
                    <span className="sr-only">
                      {step > stepNum ? 'Completed' : step === stepNum ? 'Current' : 'Not started'}{' '}
                      step {stepNum}
                    </span>
                    {step > stepNum ? '✓' : stepNum}
                  </div>
                  {stepNum < 6 && (
                    <div
                      className={`mx-1 hidden h-0.5 w-6 sm:block sm:w-8 ${
                        step > stepNum ? 'bg-[#E1BC56]' : 'bg-gray-200'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Animated Progress Bar */}
            <div
              className="h-2 w-full rounded-full bg-gray-200"
              role="progressbar"
              aria-valuenow={Math.round(getStepProgress())}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Booking completion progress"
            >
              <div
                className="progress-fill h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="heading-lg mb-2" id="booking-step-title">
            {step === 1 && 'Choose Rental Dates'}
            {step === 2 && 'Delivery Information'}
            {step === 3 && 'Review & Confirm'}
          </h2>
          <p className="body-md text-gray-600" id="booking-step-description">
            {step === 1 && 'Select when you need the Kubota SVL-75'}
            {step === 2 && 'Tell us where to deliver your equipment'}
            {step === 3 && 'Review your booking details and confirm your reservation'}
          </p>
        </div>

        {/* Equipment Preview */}
        {step <= 3 && (
          <div
            className="mb-8 rounded-lg bg-gray-50 p-6"
            role="region"
            aria-labelledby="equipment-preview-title"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src="/images/kubota-svl-75-hero.png"
                  alt="Kubota SVL-75 Compact Track Loader - Professional grade equipment with 74.3 HP diesel engine"
                  className="h-20 w-20 rounded-lg bg-white object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900" id="equipment-preview-title">
                  Kubota SVL-75 Compact Track Loader
                </h3>
                <p className="text-sm text-gray-600">74.3 HP • 9,420 lbs • Professional Grade</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-2xl font-bold text-[#E1BC56]">$450/day</span>
                  <span className="text-sm text-gray-500">Starting rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Availability Calendar */}
            <AvailabilityCalendar
              equipmentId="96488a54-2649-4e1f-8a55-9eac48de5a4d" // SVL75-001
              selectedStartDate={formData.startDate ? new Date(formData.startDate) : null}
              selectedEndDate={formData.endDate ? new Date(formData.endDate) : null}
              onDateSelect={(start: unknown, end: unknown) => {
                // Format dates using local timezone to avoid UTC conversion shifting dates
                const formatLocalDate = (date: Date): string => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };

                setFormData((prev) => ({
                  ...prev,
                  startDate: start ? formatLocalDate(start) : '',
                  endDate: end ? formatLocalDate(end) : '',
                }));
                // Clear errors when dates are selected
                setErrors((prev) => ({
                  ...prev,
                  startDate: undefined,
                  endDate: undefined,
                }));
              }}
              minDate={new Date()}
            />

            {/* Error messages if any */}
            {(errors.startDate || errors.endDate) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center text-red-800">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    {errors.startDate && <p className="text-sm">{errors.startDate}</p>}
                    {errors.endDate && <p className="text-sm">{errors.endDate}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Availability Status */}
            {availabilityState.status !== 'idle' && (
              <div
                className={`rounded-lg p-4 ${
                  availabilityState.status === 'available'
                    ? 'border border-green-200 bg-green-50'
                    : availabilityState.status === 'unavailable'
                      ? 'border border-red-200 bg-red-50'
                      : availabilityState.status === 'error'
                        ? 'border border-red-200 bg-red-50'
                        : 'border border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center">
                  {availabilityState.status === 'checking' && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-600"></div>
                  )}
                  <p
                    className={`text-sm ${
                      availabilityState.status === 'available'
                        ? 'text-green-800'
                        : availabilityState.status === 'unavailable'
                          ? 'text-red-800'
                          : availabilityState.status === 'error'
                            ? 'text-red-800'
                            : 'text-yellow-800'
                    }`}
                  >
                    {availabilityState.status === 'checking'
                      ? 'Checking availability...'
                      : availabilityState.message}
                  </p>
                </div>
              </div>
            )}

            {/* Pricing Preview */}
            {pricing && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">Pricing Preview</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Equipment Rental ({rentalDays} days)</span>
                    <span>{formatCurrency(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span className="italic text-xs">After address selection</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Taxes (15%)</span>
                    <span className="italic text-xs">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium text-gray-600">
                    <span>Estimated Starting From</span>
                    <span>{formatCurrency(pricing.subtotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <LocationPicker
              onLocationSelect={(location) => {
                setLocationData(location);
                setFormData((prev) => ({
                  ...prev,
                  deliveryAddress: location.address,
                  deliveryCity: location.city,
                  deliveryProvince: location.province || 'NB', // Default to NB
                  deliveryPostalCode: location.postalCode || '',
                }));
                // Clear errors when location is selected
                setErrors((prev) => ({
                  ...prev,
                  deliveryAddress: undefined,
                  deliveryCity: undefined,
                  deliveryProvince: undefined,
                  deliveryPostalCode: undefined,
                }));
              }}
              initialAddress={formData.deliveryAddress}
              error={errors.deliveryAddress || errors.deliveryCity}
              rentalDays={rentalDays}
              dailyRate={DAILY_RATE}
            />

            {/* Pricing now shown in blue LocationPicker component above */}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Booking Summary - Matches Step 2 Blue Section EXACTLY */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
              {pricing && (
                <div className="space-y-3">
                  {/* Distance Info */}
                  {locationData && (
                    <div className="flex items-start space-x-3">
                      <svg
                        className="mt-0.5 h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {locationData.formattedDistance}
                        </p>
                        <p className="mt-1 text-xs text-blue-700">Google Maps driving distance</p>
                        <p className="mt-1 text-xs text-green-700 font-medium">
                          ✓ You pay for exact distance (no rounding markup)
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-blue-200 pt-3">
                    <div className="space-y-2 text-sm">
                      {/* Equipment Rental */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Equipment Rental</p>
                            <p className="text-xs text-gray-600">
                              {rentalDays} day{rentalDays !== 1 ? 's' : ''} @ $450/day
                            </p>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(pricing.subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Transportation & Staging - Shows EXACT km (e.g., 114.1km not 115km) */}
                      <p className="font-medium text-gray-900">Transportation & Staging</p>
                      {locationData && locationData.distanceKm > 30 && (
                        <p className="text-xs text-gray-600">
                          Base $300 + ${((locationData.distanceKm - 30) * 3 * 2).toFixed(2)} for{' '}
                          {(locationData.distanceKm - 30).toFixed(1)}km extra (both ways)
                        </p>
                      )}

                      <div className="ml-3 space-y-2 text-xs">
                        {/* Delivery Breakdown */}
                        <div>
                          <div className="flex justify-between font-medium text-gray-700">
                            <span>• Delivery to site:</span>
                            {(!locationData || locationData.distanceKm <= 30) && (
                              <span>{formatCurrency(pricing.deliveryFee / 2)}</span>
                            )}
                          </div>
                          {locationData && locationData.distanceKm > 30 && (
                            <div className="ml-4 space-y-0.5 text-gray-600">
                              <div className="flex justify-between">
                                <span>- Standard mileage:</span>
                                <span>$150.00</span>
                              </div>
                              <div className="flex justify-between">
                                <span>
                                  - Additional mileage ({(locationData.distanceKm - 30).toFixed(1)}
                                  km × $3):
                                </span>
                                <span>${((locationData.distanceKm - 30) * 3).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-300 pt-0.5 font-medium text-gray-700">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(pricing.deliveryFee / 2)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pickup Breakdown */}
                        <div>
                          <div className="flex justify-between font-medium text-gray-700">
                            <span>• Pickup from site:</span>
                            {(!locationData || locationData.distanceKm <= 30) && (
                              <span>{formatCurrency(pricing.deliveryFee / 2)}</span>
                            )}
                          </div>
                          {locationData && locationData.distanceKm > 30 && (
                            <div className="ml-4 space-y-0.5 text-gray-600">
                              <div className="flex justify-between">
                                <span>- Standard mileage:</span>
                                <span>$150.00</span>
                              </div>
                              <div className="flex justify-between">
                                <span>
                                  - Additional mileage ({(locationData.distanceKm - 30).toFixed(1)}
                                  km × $3):
                                </span>
                                <span>${((locationData.distanceKm - 30) * 3).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-300 pt-0.5 font-medium text-gray-700">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(pricing.deliveryFee / 2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-blue-200 pt-2 text-sm">
                        <span className="font-medium text-gray-700">Transport Subtotal</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(pricing.deliveryFee)}
                        </span>
                      </div>

                      {/* Waiver (if selected) - itemized BEFORE subtotal */}
                      {waiverSelected && pricing.waiverCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            Damage Waiver ({rentalDays} day{rentalDays !== 1 ? 's' : ''} × $29)
                          </span>
                          <span className="font-medium text-gray-900">
                            +{formatCurrency(pricing.waiverCost)}
                          </span>
                        </div>
                      )}

                      {/* Subtotal, Discount, and Taxes */}
                      <div className="mt-2 space-y-1 border-t-2 border-blue-300 pt-2">
                        <div className="flex justify-between text-sm font-semibold text-gray-900">
                          <span>
                            Subtotal (Equipment + Transport{waiverSelected ? ' + Waiver' : ''})
                          </span>
                          <span>
                            {formatCurrency(
                              pricing.subtotal + pricing.deliveryFee + pricing.waiverCost
                            )}
                          </span>
                        </div>
                        {appliedDiscount && pricing.discountAmount > 0 && (
                          <div className="flex justify-between text-sm font-semibold text-green-600">
                            <span className="flex items-center">
                              <svg
                                className="mr-1 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              Discount ({appliedDiscount.code})
                            </span>
                            <span>-{formatCurrency(pricing.discountAmount)}</span>
                          </div>
                        )}
                        {appliedDiscount && pricing.discountAmount > 0 && (
                          <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-semibold text-gray-900">
                            <span>Subtotal after discount</span>
                            <span>
                              {formatCurrency(
                                pricing.subtotal +
                                  pricing.deliveryFee +
                                  pricing.waiverCost -
                                  pricing.discountAmount
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>HST (15%)</span>
                          <span>{formatCurrency(pricing.taxes)}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-300 pt-2 text-lg font-bold text-blue-900">
                          <span>Estimated Total</span>
                          <span>{formatCurrency(pricing.total)}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-600">
                          <span>
                            Security Hold (placed 48h before pickup){waiverSelected && ' 🛡'}
                          </span>
                          <span
                            className={
                              waiverSelected ? 'text-green-600 font-semibold' : 'font-semibold'
                            }
                          >
                            ${pricing.holdAmount}.00{waiverSelected && ' - Protected'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-blue-200 pt-3">
                        <p className="text-xs text-gray-600">
                          <strong>Note:</strong> This is an estimate. Final amount will be confirmed
                          before payment.
                          <br />
                          ✓ Distance rounded to nearest kilometer
                          <br />
                          ✓ Price includes equipment rental, delivery, and pickup
                          <br />✓ A $500 security deposit (refundable) will be required
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Damage Waiver Section - Enhanced Marketing */}
            <div className="rounded-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🛡</span>
                    <h3 className="text-xl font-bold text-gray-900">
                      Damage Waiver Protection — Because Accidents Happen
                    </h3>
                  </div>

                  {/* Headline */}
                  <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-100 p-4">
                    <p className="text-base font-bold text-gray-900">
                      Don't take on <span className="text-red-600">$500 of risk</span> for a{' '}
                      <span className="text-green-600">$29/day decision.</span>
                    </p>
                  </div>

                  {/* Value Proposition */}
                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-relaxed text-gray-700">
                      Even the best operators get a nick or a blown hose once in a while. Regular
                      wear and tear is always on us — but things like{' '}
                      <strong>
                        dents, scratches, or a hydraulic line failure from improper use
                      </strong>{' '}
                      aren't.
                    </p>
                    <p className="text-sm font-medium text-blue-700">
                      With Damage Waiver Protection, you're covered for those "oops" moments and
                      your $500 security hold stays protected.
                    </p>
                  </div>

                  {/* What You Get */}
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-bold text-green-700">✅ What You Get</h4>
                    <ul className="ml-4 space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-green-600">•</span>
                        <span>
                          <strong>Protection for your $500 security hold</strong> from accidental
                          damage charges
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-green-600">•</span>
                        <span>
                          Coverage for minor incidental damage (scratches, dents, blown hoses, etc.)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-green-600">•</span>
                        <span>
                          Peace of mind knowing you won't get stuck paying for small mishaps
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Without the Waiver */}
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-bold text-red-700">⚠️ Without the Waiver</h4>
                    <ul className="ml-4 space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-red-600">•</span>
                        <span>
                          <strong>Accidental damage or misuse repairs</strong> come straight out of
                          your $500 hold
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-red-600">•</span>
                        <span>
                          Your full hold <strong>stays tied up</strong> until the machine is
                          inspected and cleared
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 mt-0.5 text-red-600">•</span>
                        <span>
                          One bad move with a bucket or coupler can{' '}
                          <strong>erase your savings fast</strong>
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Social Proof */}
                  <div className="mt-4 rounded-lg border border-blue-300 bg-blue-50 p-3">
                    <p className="text-sm text-blue-900">
                      <strong className="font-bold">
                        Over 80% of renters add Damage Waiver Protection
                      </strong>{' '}
                      — because it's simply not worth gambling a $500 hold against a $29/day safety
                      net.
                    </p>
                  </div>

                  {/* Fine Print */}
                  <p className="mt-3 text-xs text-gray-500 italic">
                    Waiver covers accidental minor damage during normal operation (e.g., scratched
                    or dented body panels, blown hydraulic hoses). Does not cover intentional
                    damage, negligence, theft, or operation outside manufacturer guidelines.
                    Security hold is placed 48 hours before pickup. Equipment must be returned
                    clean, refueled, and in good condition for hold release within 24 hours.
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="ml-6 flex-shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={waiverSelected}
                    onClick={() => setWaiverSelected(!waiverSelected)}
                    className={`${
                      waiverSelected ? 'bg-green-600' : 'bg-gray-300'
                    } relative inline-flex h-10 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                  >
                    <span className="sr-only">Enable damage waiver protection</span>
                    <span
                      className={`${
                        waiverSelected ? 'translate-x-6' : 'translate-x-0'
                      } pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-bold ${waiverSelected ? 'text-green-700' : 'text-gray-500'}`}
                    >
                      {waiverSelected ? 'ADDED ✓' : 'Add Now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Waiver Cost Summary */}
              {waiverSelected && pricing && (
                <div className="mt-4 rounded-lg border border-green-300 bg-green-100 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-900">
                      Damage Waiver ({rentalDays} day{rentalDays !== 1 ? 's' : ''} @ $29/day)
                    </span>
                    <span className="font-semibold text-green-900">
                      +${pricing.waiverCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-green-300 pt-2 text-sm">
                    <span className="font-medium text-green-700">
                      🛡 Your $500 Hold is Now Protected
                    </span>
                    <span className="font-semibold text-green-700">✓ Added</span>
                  </div>
                </div>
              )}
            </div>

            {/* Discount Code Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-medium text-gray-900">Have a Promo Code?</h3>
              <DiscountCodeInput
                onDiscountApplied={setAppliedDiscount}
                subtotal={pricing ? pricing.subtotal + pricing.deliveryFee + pricing.waiverCost : 0}
              />
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-inside list-disc space-y-1">
                      <li>A security deposit will be required upon delivery</li>
                      <li>Equipment must be returned in the same condition</li>
                      <li>Delivery and pickup times will be confirmed via phone</li>
                      <li>Valid driver's license required for equipment operation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 & 5 removed - Contract signing moved to manage booking page, confirmation is now a modal */}

        {/* Enhanced Error Display with Solutions */}
        {(errors.general || submitError) && (
          <div className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="mb-2 text-base font-semibold text-red-900">
                  {holdError ? 'Card Verification Failed' : 'Unable to Complete Booking'}
                </h3>
                <p className="mb-4 text-sm text-red-800">{errors.general || submitError}</p>

                <div className="rounded-lg border border-red-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    💡 Try these solutions:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {holdError ? (
                      <>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Check that your card information is correct</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Ensure your card has sufficient funds for the hold</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Try a different payment method</span>
                        </li>
                      </>
                    ) : (
                      <>
                        {!user && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                              <Link
                                href="/auth/signin?callbackUrl=/book"
                                className="font-medium text-[#E1BC56] hover:underline"
                              >
                                Sign in to your account
                              </Link>{' '}
                              to continue
                            </span>
                          </li>
                        )}
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Check that all required fields are filled out correctly</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Try refreshing the page and starting over</span>
                        </li>
                      </>
                    )}
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <Link
                          href="/support"
                          className="font-medium text-[#E1BC56] hover:underline"
                        >
                          Contact our support team
                        </Link>{' '}
                        if the problem persists
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => {
                      setErrors({});
                      setSubmitError(null);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/support"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step <= 3 && (
          <div className="mt-8 flex justify-between" role="group" aria-label="Booking navigation">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              aria-label={
                step === 1 ? 'Previous step (disabled)' : `Go to previous step (step ${step - 1})`
              }
              className="min-h-[44px] min-w-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E1BC56] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={isLoading || isCheckingAvailability}
              aria-label={
                isLoading
                  ? 'Processing booking'
                  : isCheckingAvailability
                    ? 'Checking availability'
                    : step === 3
                      ? 'Confirm booking'
                      : 'Go to next step'
              }
              className="min-h-[44px] min-w-[44px] rounded-md border border-transparent bg-[#A90F0F] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B0B0B] focus:outline-none focus:ring-2 focus:ring-[#A90F0F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? 'Processing...'
                : isCheckingAvailability
                  ? 'Checking...'
                  : step === 3
                    ? 'Confirm Booking'
                    : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* Old confirmation modal removed - using new hold system modal workflow */}
    </>
  );
}
