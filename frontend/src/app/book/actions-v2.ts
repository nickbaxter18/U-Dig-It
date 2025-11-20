'use server';

import { z } from 'zod';

// Server client for RLS
import { revalidatePath } from 'next/cache';

import {
  type AvailabilityResult,
  type SmartSuggestion,
  availabilityService,
} from '@/lib/availability-service';
import { logger } from '@/lib/logger';
import {
  broadcastInAppNotificationToAdmins,
  createInAppNotification,
} from '@/lib/notification-service';
import { supabaseApi } from '@/lib/supabase/api-client';
import { createClient } from '@/lib/supabase/server';

// Enhanced validation schema for booking form
const bookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  deliveryCity: z.string().min(1, 'City is required'),
  deliveryProvince: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  customerEmail: z.string().email('Valid email is required').optional(),
  customerName: z.string().min(1, 'Customer name is required').optional(),
  specialInstructions: z
    .string()
    .nullish()
    .transform((val) => val ?? ''),
  customerId: z.string().uuid('Valid user ID is required'),
  // Distance-based delivery fee from LocationPicker
  calculatedDeliveryFee: z.coerce.number().optional(),
  distanceKm: z.coerce.number().optional(),
  // Coupon code fields - store metadata for dynamic calculation
  couponCode: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val === '' ? null : val)),
  couponType: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val === '' ? null : val))
    .refine(
      (val: unknown) =>
        val === null || val === 'percentage' || val === 'fixed' || val === 'fixed_amount',
      { message: 'Coupon type must be percentage, fixed, or fixed_amount' }
    ),
  couponValue: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val === '' ? null : val ? Number(val) : null)), // percentage (10) or fixed amount (50)
  // Damage waiver fields
  waiverSelected: z.coerce.boolean().default(false),
  waiverRateCents: z.coerce.number().default(2900),
  waiverTotalCents: z.coerce.number().default(0),
  holdAmountCents: z.coerce.number().default(50000),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

const DELIVERY_FEES: Record<string, number> = {
  'Saint John': 300,
  Rothesay: 320,
  Quispamsis: 350,
  'Grand Bay-Westfield': 350,
  Hampton: 380,
  Other: 400,
};

interface BookingResult {
  success: boolean;
  bookingId?: string;
  bookingNumber?: string;
  error?: string;
  pricing?: {
    dailyRate: number;
    days: number;
    subtotal: number;
    taxes: number;
    floatFee: number;
    total: number;
  };
}

/**
 * Enhanced availability checking with smart suggestions and alternatives
 */
export async function checkAvailabilityEnhanced(
  startDate: string,
  endDate: string,
  _options: {
    includeAlternatives?: boolean;
    includeSmartSuggestions?: boolean;
    maxAlternatives?: number;
  } = {}
): Promise<AvailabilityResult> {
  try {
    // ✅ BULLETPROOF FIX: Get equipment without status filter
    // Equipment status reflects CURRENT availability, not future bookings!
    // We'll check date-specific availability separately
    const equipment = await supabaseApi.getEquipmentList({
      limit: 1,
      // ❌ REMOVED: available: true - This blocks future bookings!
    });

    if (!equipment || equipment.length === 0) {
      return {
        available: false,
        message: 'No equipment configured. Please contact support.',
        confidence: 'low',
      };
    }

    const equipmentId = (equipment as unknown[])[0].id;

    // Check availability for the selected dates
    const availabilityResponse = await supabaseApi.checkAvailability(
      equipmentId,
      startDate,
      endDate
    );

    return {
      available: availabilityResponse.available,
      message: availabilityResponse.available
        ? 'Equipment is available for these dates'
        : 'Equipment is not available for these dates. Please select different dates.',
      confidence: 'high',
      pricing: availabilityResponse.pricing,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(
        'Enhanced availability check failed:',
        {
          component: 'app-actions-v2',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return {
      available: false,
      message: 'Unable to check availability. Please try again.',
      confidence: 'low',
    };
  }
}

/**
 * Get smart date suggestions for booking
 */
export async function getSmartSuggestions(
  preferences: {
    suggestWeekends?: boolean;
    suggestMidWeek?: boolean;
    suggestExtendedWeekends?: boolean;
    maxSuggestions?: number;
  } = {}
): Promise<SmartSuggestion[]> {
  try {
    return await availabilityService.generateSmartSuggestions(preferences);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(
        'Failed to generate smart suggestions:',
        {
          component: 'app-actions-v2',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return [];
  }
}

/**
 * Enhanced booking creation with better validation and error handling
 */
export async function createBookingEnhanced(formData: FormData): Promise<BookingResult> {
  try {
    // CRITICAL: Verify server-side session for RLS policies
    const supabase = await createClient();
    const {
      data: { user: serverUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !serverUser) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[createBookingEnhanced] Auth error:', {
          component: 'app-actions-v2',
          action: 'auth_error',
          metadata: { error: authError?.message || 'Unknown auth error' },
        });
      }
      return {
        success: false,
        error: 'Authentication required. Please sign in and try again.',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[createBookingEnhanced] Server-side user verified:', {
        component: 'app-actions-v2',
        action: 'debug',
        metadata: { email: serverUser.email },
      });
    }

    // Extract and validate form data
    const rawData = {
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      deliveryAddress: formData.get('deliveryAddress') as string,
      deliveryCity: formData.get('deliveryCity') as string,
      customerEmail: formData.get('customerEmail') as string,
      customerName: formData.get('customerName') as string,
      specialInstructions: formData.get('specialInstructions') as string | null,
      customerId: formData.get('customerId') as string,
      termsAccepted: formData.get('termsAccepted') as string | null,
      calculatedDeliveryFee: formData.get('calculatedDeliveryFee') as string | null,
      distanceKm: formData.get('distanceKm') as string | null,
      couponCode: (formData.get('couponCode') as string | null) || null,
      couponType: (formData.get('couponType') as string | null) || null,
      couponValue: (formData.get('couponValue') as string | null) || null,
      waiverSelected: formData.get('waiverSelected') as string | null,
      waiverRateCents: formData.get('waiverRateCents') as string | null,
      waiverTotalCents: formData.get('waiverTotalCents') as string | null,
      holdAmountCents: formData.get('holdAmountCents') as string | null,
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Server Action] Raw form data received', {
        component: 'app-actions-v2',
        action: 'debug',
        metadata: { hasData: !!rawData },
      });
    }

    const validatedData = bookingSchema.parse(rawData);

    // Verify customerId matches authenticated user
    if (validatedData.customerId !== serverUser.id) {
      return {
        success: false,
        error: 'Unauthorized: Cannot create booking for another user.',
      };
    }

    // Enhanced date validation
    const startDateObj = new Date(validatedData.startDate);
    const endDateObj = new Date(validatedData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return {
        success: false,
        error: 'Start date must be today or later',
      };
    }

    if (endDateObj <= startDateObj) {
      return {
        success: false,
        error: 'End date must be after start date',
      };
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return {
        success: false,
        error: 'Maximum rental period is 1 year',
      };
    }

    if (diffDays < 1) {
      return {
        success: false,
        error: 'Minimum rental period is 1 day',
      };
    }

    // ✅ BULLETPROOF FIX: Get equipment details without status filter
    // Equipment status reflects CURRENT availability, not future bookings!
    // We'll check date-specific availability separately
    const equipment = await supabaseApi.getEquipmentList({
      limit: 1,
      // ❌ REMOVED: available: true - This blocks future bookings!
    });

    if (!equipment || equipment.length === 0) {
      return {
        success: false,
        error: 'No equipment configured. Please contact support.',
      };
    }

    const equipmentItem = (equipment as unknown[])[0];
    const equipmentId = equipmentItem.id;

    // Enhanced availability check with alternatives
    const availabilityResponse = await supabaseApi.checkAvailability(
      equipmentId,
      validatedData.startDate,
      validatedData.endDate
    );

    if (!availabilityResponse.available) {
      const errorMessage = availabilityResponse.available
        ? 'Equipment is available for these dates'
        : 'Equipment is not available for these dates. Please select different dates.';

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Validate customer ID (passed from client)
    if (!validatedData.customerId) {
      return {
        success: false,
        error: 'You must be logged in to create a booking. Please sign in and try again.',
      };
    }

    // Calculate enhanced pricing
    const equipmentDetails = Array.isArray(equipment) ? (equipment as unknown[])[0] : equipment;
    const dailyRate = (equipmentDetails as any)?.dailyRate || 450;
    const subtotal = dailyRate * diffDays;

    // Use calculated delivery fee from LocationPicker if available, otherwise fall back to city lookup
    const floatFee = validatedData.calculatedDeliveryFee
      ? validatedData.calculatedDeliveryFee
      : validatedData.deliveryCity
        ? (DELIVERY_FEES[validatedData.deliveryCity] ?? 150)
        : 0;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Server Action] Delivery fee calculation:', {
        component: 'app-actions-v2',
        action: 'debug',
        metadata: {
          calculatedDeliveryFee: validatedData.calculatedDeliveryFee,
          distanceKm: validatedData.distanceKm,
          deliveryCity: validatedData.deliveryCity,
          finalFloatFee: floatFee,
        },
      });
    }

    // Calculate waiver cost - itemized and added to subtotal BEFORE taxes
    const waiverCost = validatedData.waiverTotalCents ? validatedData.waiverTotalCents / 100 : 0;

    // Calculate subtotal INCLUDING waiver BEFORE discount (equipment + transport + waiver)
    const subtotalBeforeDiscount = subtotal + floatFee + waiverCost;

    // ✅ SECURITY: Server-side coupon validation to prevent code sharing
    let couponDiscount = 0;
    if (validatedData.couponCode) {
      // Re-validate the coupon code on the server
      const { data: discountCode } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', validatedData.couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!discountCode) {
        return {
          success: false,
          error: 'Invalid or expired discount code',
        };
      }

      // ✅ CRITICAL: If this is a Spin to Win code, enforce user ownership
      const { data: spinSession } = await supabase
        .from('spin_sessions')
        .select('user_id, email')
        .eq('coupon_code', validatedData.couponCode.toUpperCase())
        .single();

      if (spinSession && spinSession.user_id && spinSession.user_id !== serverUser.id) {
        logger.warn("[createBookingEnhanced] Attempt to use someone else's Spin to Win code", {
          component: 'app-actions-v2',
          action: 'unauthorized_code_use',
          metadata: {
            code: validatedData.couponCode,
            attemptedBy: serverUser.id,
            actualOwner: spinSession.user_id,
          },
        });
        return {
          success: false,
          error: 'This discount code was awarded to another user and cannot be shared',
        };
      }

      // Calculate discount amount
      if (discountCode.type === 'percentage') {
        couponDiscount = subtotalBeforeDiscount * (parseFloat(discountCode.value) / 100);
      } else if (discountCode.type === 'fixed_amount') {
        couponDiscount = Math.min(parseFloat(discountCode.value), subtotalBeforeDiscount);
      }
    }

    // Subtotal after discount
    const subtotalAfterDiscount = subtotalBeforeDiscount - couponDiscount;

    // Calculate taxes on discounted amount (15% HST)
    const taxes = subtotalAfterDiscount * 0.15;

    // Final total
    const total = subtotalAfterDiscount + taxes;

    // Parse terms acceptance data if provided
    let termsAcceptedData = null;
    if (rawData.termsAccepted) {
      try {
        termsAcceptedData = JSON.parse(rawData.termsAccepted);
      } catch {
        // If parsing fails, store as-is
        termsAcceptedData = rawData.termsAccepted;
      }
    }

    // Create booking via Supabase with enhanced data
    const bookingData = {
      bookingNumber: `BK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      equipmentId,
      customerId: validatedData.customerId, // Use customer ID from form data
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      deliveryAddress: validatedData.deliveryAddress,
      deliveryCity: validatedData.deliveryCity,
      dailyRate,
      weeklyRate: dailyRate * 5, // 5 days per week
      monthlyRate: dailyRate * 20, // 20 days per month
      subtotal,
      taxes,
      floatFee,
      deliveryFee: floatFee,
      distanceKm: validatedData.distanceKm, // Store actual distance from LocationPicker
      couponCode: validatedData.couponCode || null,
      couponType: validatedData.couponType || null,
      couponValue: validatedData.couponValue || null,
      couponDiscount: couponDiscount, // Calculated amount for reporting/display
      waiver_selected: validatedData.waiverSelected,
      waiver_rate_cents: validatedData.waiverRateCents,
      hold_amount_cents: validatedData.holdAmountCents,
      totalAmount: total,
      securityDeposit: 500, // Standard deposit
      specialInstructions: validatedData.specialInstructions,
      termsAccepted: termsAcceptedData,
      status: 'pending' as const,
      type: 'delivery' as const,
    };

    // ✅ CRITICAL DEBUG: Log exact coupon values before insert
    console.log('🔍 COUPON DEBUG:', {
      couponCode: bookingData.couponCode,
      couponType: bookingData.couponType,
      couponValue: bookingData.couponValue,
      couponCodeType: typeof bookingData.couponCode,
      couponTypeType: typeof bookingData.couponType,
      couponTypeIsNull: bookingData.couponType === null,
      couponTypeIsEmptyString: bookingData.couponType === '',
      couponTypeIsUndefined: bookingData.couponType === undefined,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Server Action] Creating booking with validated data', {
        component: 'app-actions-v2',
        action: 'debug',
      });
    }

    // CRITICAL: Use server-side Supabase client for INSERT to satisfy RLS policies
    // The server client has access to cookies, enabling auth.uid() to work in RLS policies
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[Server Action] Booking insert error:', {
          component: 'app-actions-v2',
          action: 'booking_insert_error',
          metadata: { error: bookingError?.message || 'Unknown booking error' },
        });
      }
      throw bookingError;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Server Action] Booking created successfully', {
        component: 'app-actions-v2',
        action: 'debug',
      });
    }

    // Increment coupon usage count if coupon was applied
    if (validatedData.couponCode) {
      // First, get current usage
      const { data: currentCode } = await supabase
        .from('discount_codes')
        .select('used_count')
        .eq('code', validatedData.couponCode.toUpperCase())
        .single();

      // Increment usage count
      const { error: couponError } = await supabase
        .from('discount_codes')
        .update({ used_count: (currentCode?.used_count || 0) + 1 })
        .eq('code', validatedData.couponCode.toUpperCase());

      if (couponError) {
        logger.error(
          '[Server Action] Failed to increment coupon usage',
          {
            component: 'app-actions-v2',
            action: 'coupon_increment_error',
            metadata: { code: validatedData.couponCode },
          },
          couponError
        );
        // Don't fail the booking if coupon increment fails
      } else {
        logger.info('[Server Action] Coupon usage incremented', {
          component: 'app-actions-v2',
          action: 'coupon_used',
          metadata: {
            code: validatedData.couponCode,
            discount: couponDiscount,
            bookingId: booking.id,
          },
        });
      }

      // ✅ SPIN-TO-WIN REDEMPTION TRACKING
      // Check if this is a spin-to-win code and mark it as redeemed
      const { data: spinSession } = await supabase
        .from('spin_sessions')
        .select('id, email, prize_pct, used_at')
        .eq('coupon_code', validatedData.couponCode.toUpperCase())
        .single();

      if (spinSession && !spinSession.used_at) {
        // Mark as redeemed!
        const { error: spinError } = await supabase
          .from('spin_sessions')
          .update({
            used_at: new Date().toISOString(),
            booking_id: booking.id,
          })
          .eq('id', spinSession.id);

        if (spinError) {
          logger.error(
            '[Server Action] Failed to mark spin session as redeemed',
            {
              component: 'app-actions-v2',
              action: 'spin_redemption_error',
              metadata: { spinSessionId: spinSession.id, bookingId: booking.id },
            },
            spinError
          );
        } else {
          logger.info('🎉 [Server Action] Spin-to-Win code redeemed!', {
            component: 'app-actions-v2',
            action: 'spin_code_redeemed',
            metadata: {
              spinSessionId: spinSession.id,
              bookingId: booking.id,
              couponCode: validatedData.couponCode,
              prizeAmount: spinSession.prize_pct,
              customerEmail: spinSession.email,
            },
          });
        }
      }
    }

    // Email notifications are handled by booking confirmation system
    // Email will be sent automatically when all booking steps complete
    // See: frontend/src/app/booking/[id]/actions-completion.ts
    logger.info('Booking created successfully - email will be sent after completion', {
      component: 'app-actions-v2',
      action: 'booking_created',
      metadata: { bookingNumber: booking.bookingNumber },
    });

    // Clear availability cache to ensure fresh data
    availabilityService.clearCache();

    // Queue notifications (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const bookingManageUrl = `${appUrl}/booking/${booking.id}/manage`;

    try {
      await createInAppNotification({
        supabase,
        userId: booking.customerId ?? serverUser.id,
        category: 'booking',
        priority: 'medium',
        title: 'We received your booking request',
        message: `Thanks ${booking.bookingNumber ? `for booking ${booking.bookingNumber}` : 'for your booking'}. Our team will review the details and guide you through the next steps.`,
        actionUrl: bookingManageUrl,
        ctaLabel: 'Continue setup',
        templateId: 'booking_request_received',
        templateData: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          startDate: booking.startDate,
          endDate: booking.endDate,
        },
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          event: 'booking_request_received',
        },
      });
    } catch (notificationError) {
      logger.error(
        '[createBookingEnhanced] Failed to queue customer booking notification',
        {
          component: 'app-actions-v2',
          action: 'booking_notification_error',
          metadata: { bookingId: booking.id },
        },
        notificationError instanceof Error
          ? notificationError
          : new Error(String(notificationError))
      );
    }

    try {
      await broadcastInAppNotificationToAdmins({
        supabase,
        category: 'booking',
        priority: 'medium',
        title: `New booking request ${booking.bookingNumber ?? ''}`.trim(),
        message: `${serverUser.email ?? 'A customer'} started a booking for ${booking.startDate?.slice(0, 10)} to ${booking.endDate?.slice(0, 10)}.`,
        actionUrl: `${appUrl}/admin/bookings/${booking.id}`,
        ctaLabel: 'Review booking',
        templateId: 'admin_booking_request',
        templateData: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          startDate: booking.startDate,
          endDate: booking.endDate,
          customerId: booking.customerId ?? serverUser.id,
        },
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          event: 'admin_booking_request',
        },
      });
    } catch (adminNotificationError) {
      logger.error(
        '[createBookingEnhanced] Failed to broadcast admin booking notification',
        {
          component: 'app-actions-v2',
          action: 'admin_booking_notification_error',
          metadata: { bookingId: booking.id },
        },
        adminNotificationError instanceof Error
          ? adminNotificationError
          : new Error(String(adminNotificationError))
      );
    }

    // Revalidate paths to update availability
    try {
      revalidatePath('/book');
      revalidatePath('/equipment');
    } catch {
      // Revalidation is optional, don't fail booking if it errors
    }

    return {
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      pricing: {
        dailyRate,
        days: diffDays,
        subtotal,
        taxes,
        floatFee,
        total,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(
        'Enhanced booking creation error:',
        {
          component: 'app-actions-v2',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      return {
        success: false,
        error: `Validation errors: ${errorMessages.join(', ')}`,
      };
    }

    // Return detailed error message in development
    // Handle Supabase PostgresError (has message, code, details, hint properties)
    let errorMessage = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
      if (process.env.NODE_ENV === 'development' && 'details' in error) {
        errorMessage += ` | Details: ${(error as { details: string }).details}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error:
        process.env.NODE_ENV === 'development'
          ? `Booking creation failed: ${errorMessage}`
          : 'Failed to create booking. Please try again.',
    };
  }
}

/**
 * Get equipment availability calendar for a date range
 */
export async function getAvailabilityCalendar(
  startDate: string,
  endDate: string,
  equipmentId?: string
): Promise<
  {
    available: boolean;
    date: string;
    reason?: string;
  }[]
> {
  try {
    const calendar: { available: boolean; date: string; reason?: string }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      try {
        const availability = await supabaseApi.checkAvailability(
          equipmentId || 'default-equipment-id',
          dateStr,
          dateStr
        );

        calendar.push({
          available: availability.available,
          date: dateStr,
          reason: availability.available ? undefined : 'Not available',
        });
      } catch {
        calendar.push({
          available: false,
          date: dateStr,
          reason: 'Unable to check',
        });
      }
    }

    return calendar;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(
        'Failed to get availability calendar:',
        {
          component: 'app-actions-v2',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return [];
  }
}

/**
 * Validate booking dates and return detailed validation results
 */
export async function validateBookingDates(
  startDate: string,
  endDate: string,
  equipmentId?: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Basic validation
    if (start < today) {
      errors.push('Start date cannot be in the past');
    }

    if (end <= start) {
      errors.push('End date must be after start date');
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      errors.push('Maximum rental period is 1 year');
    }

    if (diffDays < 1) {
      errors.push('Minimum rental period is 1 day');
    }

    // Weekend warnings
    if (start.getDay() === 6 || start.getDay() === 0) {
      warnings.push('Weekend rentals may have higher demand');
    }

    // Long weekend suggestions
    if (diffDays >= 3 && diffDays <= 5) {
      suggestions.push('Consider extending to a full week for better rates');
    }

    // Check availability if no basic errors
    if (errors.length === 0 && equipmentId) {
      const availability = await supabaseApi.checkAvailability(equipmentId, startDate, endDate);

      if (!availability.available) {
        errors.push(
          availability.available
            ? 'Equipment is available for these dates'
            : 'Equipment is not available for these dates. Please select different dates.'
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(
        'Date validation failed:',
        {
          component: 'app-actions-v2',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return {
      valid: false,
      errors: ['Unable to validate dates. Please try again.'],
      warnings: [],
      suggestions: [],
    };
  }
}
